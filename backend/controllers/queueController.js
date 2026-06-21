import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Clinic from '../models/Clinic.js';
import User from '../models/User.js';

const SECRET_KEY = process.env.JWT_SECRET || "pulseflow_super_secret_key_2026";

// ==========================================
// 1. HELPER: SOCKET.IO BROADCASTER
// ==========================================
export const broadcastClinicState = async (io, clinicId) => {
  try {
    // .lean() strips heavy Mongoose methods, making the read operation 3-5x faster
    const clinic = await Clinic.findById(clinicId).lean();
    if (!clinic) return;

    const waitingList = await Patient.find({ clinicId, status: 'waiting' })
      .sort({ joinedAt: 1 })
      .lean(); // Faster array population

    // Broadcast instantly to the isolated clinic room
    io.to(clinicId.toString()).emit('queue_updated', {
      activeToken: clinic.currentToken,
      averageTime: clinic.avgConsultationTime, // Keep raw decimal for precise frontend math
      currentPatientCalledAt: clinic.currentPatientCalledAt, // NEW: Send the live timestamp
      waitingList
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
    // We accept both 'doctorName' and 'name' to prevent frontend mismatch crashes
    const { clinicName, doctorName, name, username, password } = req.body;
    const finalDocName = doctorName || name;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already taken" });

    // Generate unique Clinic Code (e.g., SM-7X4K92)
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
    // THIS WILL TELL US EXACTLY WHY IT IS FAILING
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

    // Generate unique tracking ID (e.g., PF-4921)
    const trackingId = `PF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient = new Patient({
      clinicId, 
      tokenNumber: clinic.highestToken, 
      trackingId, 
      name, 
      mobile, 
      priority: priority || 'Normal'
    });

    await newPatient.save();
    await clinic.save();

    await broadcastClinicState(req.io, clinicId);
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
      clinic.currentPatientCalledAt = null; // NEW: Clear the live timer
      await clinic.save();
    }

    await Patient.deleteMany({ clinicId, status: { $in: ['waiting', 'serving'] } });

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

// ==========================================
// 4. DOCTOR ACTIONS (Flow Control)
// ==========================================
export const callNext = async (req, res) => {
  try {
    const clinicId = req.user.clinicId; 
    
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: "Only doctors can call the next patient." });
    }

    const clinic = await Clinic.findById(clinicId);
    if (clinic.currentToken !== 0) {
      return res.status(400).json({ message: "Complete the current consultation first." });
    }

    const nextPatient = await Patient.findOne({ clinicId, status: 'waiting' }).sort({ joinedAt: 1 });
    
    if (nextPatient) {
      nextPatient.status = 'serving';
      nextPatient.calledAt = new Date();
      await nextPatient.save();
      
      clinic.currentToken = nextPatient.tokenNumber;
      clinic.currentPatientCalledAt = new Date(); // NEW: Start the live timer!
      await clinic.save();
    } else {
      return res.status(400).json({ message: "Queue is empty" });
    }

    await broadcastClinicState(req.io, clinicId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error calling next patient" });
  }
};

export const completeConsultation = async (req, res) => {
  try {
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

      // Dynamic AI Wait Time Engine (70% history, 30% recent)
      clinic.avgConsultationTime = (clinic.avgConsultationTime * 0.7) + (durationMins * 0.3);
      clinic.currentToken = 0; 
      clinic.currentPatientCalledAt = null; // NEW: Reset the live timer
      await clinic.save();

      await broadcastClinicState(req.io, clinicId);
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ message: "No patient is currently inside." });
    }
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
    const waitingList = await Patient.find({ clinicId, status: 'waiting' }).sort({ joinedAt: 1 });
    
    res.status(200).json({
      clinicCode: clinic ? clinic.clinicCode : '',
      activeToken: clinic ? clinic.currentToken : 0,
      averageTime: clinic ? clinic.avgConsultationTime : 10, // unrounded
      currentPatientCalledAt: clinic ? clinic.currentPatientCalledAt : null, // NEW
      waitingList
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

    const waitingList = await Patient.find({ clinicId: clinic._id, status: 'waiting' }).sort({ joinedAt: 1 });
    
    res.status(200).json({
      clinicName: clinic.name,
      clinicId: clinic._id,
      activeToken: clinic.currentToken,
      averageTime: clinic.avgConsultationTime, // unrounded
      currentPatientCalledAt: clinic.currentPatientCalledAt, // NEW
      waitingList
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
    
    const peopleAhead = await Patient.countDocuments({
      clinicId: patient.clinicId,
      status: 'waiting',
      joinedAt: { $lt: patient.joinedAt } 
    });

    res.status(200).json({
      patient,
      clinic: {
        name: clinic.name,
        activeToken: clinic.currentToken,
        averageTime: clinic.avgConsultationTime, // unrounded
        currentPatientCalledAt: clinic.currentPatientCalledAt, // NEW
        clinicId: clinic._id
      },
      peopleAhead
    });
  } catch (error) {
    res.status(500).json({ message: "Error tracking patient" });
  }
};