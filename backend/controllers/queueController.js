import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import { notificationQueue } from '../queues/notificationQueue.js';
import mongoose from 'mongoose';

const SECRET_KEY = process.env.JWT_SECRET || "pulseflow_super_secret_key_2026";

const getSortedWaitingList = async (clinicId) => {
  return await Patient.aggregate([
    { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), status: 'waiting' } },
    { $addFields: {
        priorityWeight: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'Emergency'] }, then: 1 },
              { case: { $eq: ['$priority', 'High'] }, then: 2 },
              { case: { $eq: ['$priority', 'Normal'] }, then: 3 }
            ],
            default: 3
          }
        }
    }},
    { $sort: { priorityWeight: 1, joinedAt: 1 } } // Sort by Priority FIRST, then by Arrival Time
  ]);
};

// ==========================================
// 1. HELPER: SOCKET.IO BROADCASTER
// ==========================================
export const broadcastClinicState = async (io, clinicId) => {
  try {
    const clinic = await Clinic.findById(clinicId).lean();
    if (!clinic) return;

    // Fetch active waiting list
    const waitingList = await getSortedWaitingList(clinicId);

    // Fetch active skipped list for the receptionist's recall panel
    const skippedList = await Patient.find({ clinicId, status: 'skipped' })
      .sort({ joinedAt: 1 })
      .lean();

    io.to(clinicId.toString()).emit('queue_updated', {
      clinicCode: clinic.clinicCode,
      activeToken: clinic.currentToken,
      averageTime: clinic.avgConsultationTime, 
      currentPatientCalledAt: clinic.currentPatientCalledAt, 
      isPaused: clinic.isPaused,        
      pauseReason: clinic.pauseReason,  
      waitingList,
      skippedList // Broadcasted instantly to sync front-desk panel
    });
  } catch (error) {
    console.error("Error broadcasting state:", error);
  }
};

// ==========================================
// 2. AUTHENTICATION & REGISTRATION
// ==========================================
export const registerDoctor = async (req, res) => {
  try {
    const { clinicName, doctorName, name, username, password } = req.body;
    const finalDocName = doctorName || name;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already taken" });

    const prefix = clinicName.substring(0, 2).toUpperCase();
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const clinicCode = `${prefix}-${randomChars}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newClinic = new Clinic({ name: clinicName, clinicCode });
    await newClinic.save();

    await User.create({ 
      name: finalDocName, 
      username, 
      password: hashedPassword, 
      role: 'doctor', 
      clinicId: newClinic._id 
    });

    res.status(201).json({ success: true, message: "Clinic created", clinicCode });
  } catch (error) {
    console.error("DETAILED REGISTRATION ERROR:", error);
    res.status(500).json({ message: error.message || "Registration failed" });
  }
};

export const registerReceptionist = async (req, res) => {
  try {
    const { clinicCode, name, receptionistName, username, password } = req.body;
    const finalName = name || receptionistName;

    const clinic = await Clinic.findOne({ clinicCode: clinicCode.toUpperCase() });
    if (!clinic) return res.status(404).json({ message: "Invalid Clinic Code" });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      name: finalName, 
      username, 
      password: hashedPassword, 
      role: 'receptionist', 
      clinicId: clinic._id
    });

    res.status(201).json({ success: true, message: "Joined successfully" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

export const loginClinic = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid username or password" });

    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId }, 
      SECRET_KEY, 
      { expiresIn: '12h' }
    );
    
    res.status(200).json({ success: true, token, role: user.role, clinicId: user.clinicId });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

// ==========================================
// 3. RECEPTIONIST ACTIONS (Queue Management)
// ==========================================
export const addPatient = async (req, res) => {
  try {
    const clinicId = req.user.clinicId; 
    const { name, mobile, priority } = req.body;
    
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });

    clinic.highestToken += 1;
    const trackingId = `PF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient = new Patient({
      clinicId, tokenNumber: clinic.highestToken, trackingId, name, mobile, priority: priority || 'Normal'
    });

    await newPatient.save();
    await clinic.save();
    await broadcastClinicState(req.io, clinicId);

    // ==========================================
    // BULLMQ: Dispatch Registration SMS Job & MOCK NOTIFICATION
    // ==========================================
    if (mobile) {
      const frontendUrl = req.headers.origin || 'http://localhost:5173';

      await notificationQueue.add('send-registration-sms', {
        type: 'REGISTRATION',
        patientId: newPatient._id,
        patientName: newPatient.name,
        phoneNumber: newPatient.mobile,
        tokenNumber: newPatient.tokenNumber,
        trackingLink: `${frontendUrl}/track/${newPatient.trackingId}`
      });

      // Emit mock notification for UI
      req.io.to(clinicId.toString()).emit('notification_received', {
        id: newPatient._id + '-reg',
        token: `A-${newPatient.tokenNumber}`,
        patientName: newPatient.name,
        type: 'Registration SMS',
        message: `Hello ${newPatient.name}, Your token number is A-${newPatient.tokenNumber}. Track live status at: ${frontendUrl}/track/${newPatient.trackingId}`,
        timestamp: new Date()
      });
    }

    res.status(201).json({ success: true, patient: newPatient });
  } catch (error) { 
    res.status(500).json({ message: "Error adding patient" }); 
  }
};

export const editPatient = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') return res.status(403).json({ message: "Only staff can edit patients" });
    
    const { patientId } = req.params;
    const { name, mobile } = req.body;
    
    await Patient.findByIdAndUpdate(patientId, { name, mobile });
    await broadcastClinicState(req.io, req.user.clinicId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error editing patient" });
  }
};

export const cancelPatient = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') return res.status(403).json({ message: "Only staff can cancel tokens" });
    
    await Patient.findByIdAndDelete(req.params.patientId);
    await broadcastClinicState(req.io, req.user.clinicId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling patient" });
  }
};

export const resetQueue = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const clinic = await Clinic.findById(clinicId);
    
    if (clinic) {
      clinic.currentToken = 0;
      clinic.highestToken = 0;
      clinic.currentPatientCalledAt = null; 
      await clinic.save();
    }

    await Patient.deleteMany({ clinicId, status: { $in: ['waiting', 'serving', 'skipped', 'cancelled'] } });

    await broadcastClinicState(req.io, clinicId);
    res.status(200).json({ success: true, message: "Queue reset for new session" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting queue" });
  }
};

export const updateAverageTime = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') {
      return res.status(403).json({ message: "Only staff can update settings" });
    }
    
    const { newAverageTime } = req.body;
    const clinic = await Clinic.findById(req.user.clinicId);
    
    if (clinic) {
      clinic.avgConsultationTime = Number(newAverageTime);
      await clinic.save();
      await broadcastClinicState(req.io, req.user.clinicId);
      res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating time" });
  }
};

export const togglePauseQueue = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.user.clinicId);
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });

    clinic.isPaused = !clinic.isPaused;
    clinic.pauseReason = clinic.isPaused ? (req.body.reason || 'Doctor on break') : '';
    await clinic.save();

    await broadcastClinicState(req.io, clinic._id);
    res.status(200).json({ success: true, isPaused: clinic.isPaused });
  } catch (error) {
    res.status(500).json({ message: "Error toggling pause" });
  }
};

// ==========================================
// 4. WORKFLOW ENGINE (Role-Based Strict Control)
// ==========================================

// RECEPTIONIST ONLY: Call Next
export const callNext = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') return res.status(403).json({ message: "Forbidden" });

    const clinicId = req.user.clinicId; 
    const clinic = await Clinic.findById(clinicId);

    // GUARDRAIL: Prevent calling next if queue is paused
    if (clinic.isPaused) {
      return res.status(400).json({ message: "Queue is paused. Resume to call next." });
    }

    if (clinic.currentToken !== 0) return res.status(400).json({ message: "Consultation in progress." });

    const sortedList = await getSortedWaitingList(clinicId);
    const nextPatient = sortedList.length > 0 ? await Patient.findById(sortedList[0]._id) : null;
    
    if (nextPatient) {
      nextPatient.status = 'serving';
      nextPatient.calledAt = new Date();
      await nextPatient.save();
      
      clinic.currentToken = nextPatient.tokenNumber;
      clinic.currentPatientCalledAt = new Date(); 
      await clinic.save();

      // ==========================================
      // BULLMQ: Turn Alert (2 Patients Ahead)
      // ==========================================
      const patientToAlert = await Patient.findOne({ clinicId, status: 'waiting' }).sort({ joinedAt: 1 }).skip(2);
      
      if (patientToAlert && patientToAlert.mobile) {
        await notificationQueue.add('send-turn-alert', {
          type: 'TURN_ALERT',
          patientId: patientToAlert._id,
          phoneNumber: patientToAlert.mobile,
          tokenNumber: patientToAlert.tokenNumber,
          patientsAhead: 2
        });

        // Emit mock notification for UI
        req.io.to(clinicId.toString()).emit('notification_received', {
          id: patientToAlert._id + '-turn',
          token: `A-${patientToAlert.tokenNumber}`,
          patientName: patientToAlert.name,
          type: 'Turn Alert SMS',
          message: `Hello ${patientToAlert.name}, you have exactly 2 patients ahead of you. Please step near the cabin.`,
          timestamp: new Date()
        });
      }

    } else {
      return res.status(400).json({ message: "Queue is empty" });
    }

    await broadcastClinicState(req.io, clinicId);
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ message: "Error calling next patient" }); }
};

// RECEPTIONIST ONLY: Skip Absent Patient (With Anti-Abuse Penalty Logic)
export const skipPatient = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') return res.status(403).json({ message: "Forbidden" });

    const clinicId = req.user.clinicId;
    const clinic = await Clinic.findById(clinicId);
    const currentPatient = await Patient.findOne({ clinicId, status: 'serving' });
    
    if (currentPatient) {
      currentPatient.skipCount += 1;

      if (currentPatient.skipCount === 1) {
        currentPatient.status = 'skipped';
        
        // ==========================================
        // BULLMQ: Recall Alert SMS
        // ==========================================
        if (currentPatient.mobile) {
          await notificationQueue.add('send-recall-alert', {
            type: 'RECALL_ALERT',
            patientId: currentPatient._id,
            phoneNumber: currentPatient.mobile,
            tokenNumber: currentPatient.tokenNumber
          });

          // Emit mock notification for UI
          req.io.to(clinicId.toString()).emit('notification_received', {
            id: currentPatient._id + '-skip',
            token: `A-${currentPatient.tokenNumber}`,
            patientName: currentPatient.name,
            type: 'Absent Alert SMS',
            message: `Token A-${currentPatient.tokenNumber} was called but you were absent. Your spot has been safely moved to the holding Recall Queue.`,
            timestamp: new Date()
          });
        }

      } else {
        currentPatient.status = 'cancelled';
      }
      
      await currentPatient.save(); 
      clinic.currentToken = 0;
      clinic.currentPatientCalledAt = null;
      await clinic.save();
    } else {
      return res.status(400).json({ message: "No patient is currently inside." });
    }

    await broadcastClinicState(req.io, clinicId);
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ message: "Error skipping patient" }); }
};

// RECEPTIONIST ONLY: Recall Skipped Patient (Fair Recall Logic - Option A)
export const recallPatient = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') {
      return res.status(403).json({ message: "Only the Receptionist can recall patients." });
    }

    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Look up the current oldest patient in the primary waiting roster
    const topWaitingPatient = await Patient.findOne({ clinicId: req.user.clinicId, status: 'waiting' }).sort({ joinedAt: 1 });

    if (topWaitingPatient) {
      // Time-Travel Calculation: Make this patient's timestamp 1 second older than the top patient.
      // This forces them to naturally bubble up as the absolute next person in line.
      patient.joinedAt = new Date(new Date(topWaitingPatient.joinedAt).getTime() - 1000);
    }

    patient.status = 'waiting';
    await patient.save();

    await broadcastClinicState(req.io, req.user.clinicId);
    res.status(200).json({ success: true, message: "Patient successfully positioned as next up." });
  } catch (error) {
    res.status(500).json({ message: "Error recalling patient" });
  }
};

// DOCTOR ONLY: Complete Consultation
export const completeConsultation = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: "Only the Doctor can complete a consultation." });
    }

    const clinicId = req.user.clinicId;
    const clinic = await Clinic.findById(clinicId);
    const currentPatient = await Patient.findOne({ clinicId, status: 'serving' });
    
    if (currentPatient) {
      currentPatient.status = 'completed';
      currentPatient.completedAt = new Date();
      
      const durationMs = currentPatient.completedAt - (currentPatient.calledAt || currentPatient.joinedAt);
      const durationMins = Math.max(durationMs / 1000 / 60, 1); 
      
      currentPatient.consultationDuration = durationMins;
      await currentPatient.save();

      // Dynamic Wait Time Engine (70% history, 30% recent)
      clinic.avgConsultationTime = (clinic.avgConsultationTime * 0.7) + (durationMins * 0.3);
    }

    // Empty the cabin (Does NOT auto-call next, hands control back to reception)
    clinic.currentToken = 0; 
    clinic.currentPatientCalledAt = null; 
    await clinic.save();

    await broadcastClinicState(req.io, clinicId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error completing consultation" });
  }
};

// ==========================================
// 5. PUBLIC ACTIONS (No Auth Required)
// ==========================================
export const getQueueState = async (req, res) => {
  try {
    const { clinicId } = req.query; 
    if (!clinicId) return res.status(400).json({ message: "Clinic ID required" });

    const clinic = await Clinic.findById(clinicId);
    const waitingList = await getSortedWaitingList(clinic._id);
    const skippedList = await Patient.find({ clinicId, status: 'skipped' }).sort({ joinedAt: 1 });
    
    res.status(200).json({
      clinicCode: clinic ? clinic.clinicCode : '',
      activeToken: clinic ? clinic.currentToken : 0,
      averageTime: clinic ? clinic.avgConsultationTime : 10, 
      currentPatientCalledAt: clinic ? clinic.currentPatientCalledAt : null, 
      isPaused: clinic ? clinic.isPaused : false,
      pauseReason: clinic ? clinic.pauseReason : '',
      waitingList,
      skippedList
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching queue" });
  }
};

export const getPublicQueueState = async (req, res) => {
  try {
    const { clinicCode } = req.params;
    const clinic = await Clinic.findOne({ clinicCode: clinicCode.toUpperCase() });
    
    if (!clinic) return res.status(404).json({ message: "Invalid Clinic Code" });

    const waitingList = await getSortedWaitingList(clinic._id);
    const skippedList = await Patient.find({ clinicId: clinic._id, status: 'skipped' }).sort({ joinedAt: 1 });
    
    res.status(200).json({
      clinicName: clinic.name,
      clinicId: clinic._id,
      activeToken: clinic.currentToken,
      averageTime: clinic.avgConsultationTime, 
      currentPatientCalledAt: clinic.currentPatientCalledAt, 
      isPaused: clinic.isPaused,
      pauseReason: clinic.pauseReason,
      waitingList,
      skippedList
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching public queue" });
  }
};

export const trackPatient = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    const patient = await Patient.findOne({ trackingId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const clinic = await Clinic.findById(patient.clinicId);
    
    let peopleAhead = 0;
    if (patient.status === 'waiting') {
      const sortedList = await getSortedWaitingList(patient.clinicId);
      const index = sortedList.findIndex(p => p._id.toString() === patient._id.toString());
      peopleAhead = index !== -1 ? index : 0; 
    }

    res.status(200).json({
      patient,
      clinic: {
        name: clinic.name,
        activeToken: clinic.currentToken,
        averageTime: clinic.avgConsultationTime, 
        currentPatientCalledAt: clinic.currentPatientCalledAt, 
        isPaused: clinic.isPaused,        
        pauseReason: clinic.pauseReason,  
        clinicId: clinic._id
      },
      peopleAhead
    });
  } catch (error) {
    res.status(500).json({ message: "Error tracking patient" });
  }
};