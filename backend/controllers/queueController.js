import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Clinic from '../models/Clinic.js';
import User from '../models/User.js';

// In production, this should be inside your .env file
const SECRET_KEY = process.env.JWT_SECRET || "pulseflow_super_secret_key_2026";

// Helper to broadcast state to a SPECIFIC clinic room only
const broadcastClinicState = async (io, clinicId) => {
  const clinic = await Clinic.findById(clinicId);
  const waitingList = await Patient.find({ clinicId, status: 'waiting' }).sort({ joinedAt: 1 });
  
  io.to(clinicId.toString()).emit('queue_updated', {
    activeToken: clinic ? clinic.currentToken : 0,
    averageTime: clinic ? clinic.avgConsultationTime.toFixed(1) : 10,
    waitingList
  });
};

// 1. SECURE REGISTRATION: Creates Clinic + 2 Staff Accounts
// 1A. DOCTOR REGISTRATION (Creates Clinic + Generates Code)
export const registerDoctor = async (req, res) => {
  try {
    const { clinicName, doctorName, username, password } = req.body;
    
    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already taken" });

    // Generate a unique 6-character Clinic Code (e.g., SC-7X4K92)
    const prefix = clinicName.substring(0, 2).toUpperCase();
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const clinicCode = `${prefix}-${randomChars}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Clinic
    const newClinic = new Clinic({ name: clinicName, clinicCode });
    await newClinic.save();

    // Create Doctor Account
    await User.create({ 
      name: doctorName, 
      username, 
      password: hashedPassword, 
      role: 'doctor', 
      clinicId: newClinic._id 
    });

    res.status(201).json({ 
      success: true, 
      message: "Clinic created successfully!", 
      clinicCode 
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

// 1B. RECEPTIONIST REGISTRATION (Joins existing Clinic via Code)
export const registerReceptionist = async (req, res) => {
  try {
    const { clinicCode, receptionistName, username, password } = req.body;

    // Verify Clinic Code exists
    const clinic = await Clinic.findOne({ clinicCode: clinicCode.toUpperCase() });
    if (!clinic) return res.status(404).json({ message: "Invalid Clinic Code" });

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already taken" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Receptionist Account linked to the found clinicId
    await User.create({
      name: receptionistName,
      username,
      password: hashedPassword,
      role: 'receptionist',
      clinicId: clinic._id
    });

    res.status(201).json({ success: true, message: "Receptionist joined successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

// 2. SECURE LOGIN: Generates JWT
export const loginClinic = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid username or password" });

    // Generate Encrypted Token
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId }, 
      SECRET_KEY, 
      { expiresIn: '12h' }
    );

    res.status(200).json({ 
      success: true, 
      token, 
      role: user.role, 
      clinicId: user.clinicId 
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

// 3. SECURED ACTION: Add a new patient
// SECURED ACTION: Add a new patient
export const addPatient = async (req, res) => {
  try {
    const clinicId = req.user.clinicId; 
    const { name, mobile, priority } = req.body; // Added mobile
    
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });

    clinic.highestToken += 1;
    const newToken = clinic.highestToken;

    // Generate Tracking ID: e.g., PF-8342
    const trackingId = `PF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient = new Patient({
      clinicId,
      tokenNumber: newToken,
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
    res.status(500).json({ success: false, message: "Error adding patient" });
  }
};

// 4. SECURED ACTION: Doctor calls next patient
export const callNext = async (req, res) => {
  try {
    const clinicId = req.user.clinicId; 
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });

    // SECURITY UPDATE: Only Doctors can call the next patient
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: "Only doctors can call the next patient." });
    }

    // Ensure the doctor isn't already seeing someone
    if (clinic.currentToken !== 0) {
      return res.status(400).json({ message: "Please complete the current consultation first." });
    }

    const nextPatient = await Patient.findOne({ clinicId, status: 'waiting' }).sort({ joinedAt: 1 });
    
    if (nextPatient) {
      nextPatient.status = 'serving';
      nextPatient.calledAt = new Date();
      clinic.currentToken = nextPatient.tokenNumber;
      clinic.lastUpdated = new Date();
      await nextPatient.save();
    } else {
      return res.status(400).json({ success: false, message: "Queue is empty" });
    }

    await clinic.save();
    await broadcastClinicState(req.io, clinicId);
    res.status(200).json({ success: true, message: "Advanced to next patient" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error calling next patient" });
  }
};

// NEW: SECURED ACTION: Receptionist Cancels/Deletes a Token
export const cancelPatient = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') return res.status(403).json({ message: "Only receptionists can cancel tokens." });
    
    const { patientId } = req.params;
    await Patient.findByIdAndDelete(patientId); // Removes them from the queue entirely
    
    await broadcastClinicState(req.io, req.user.clinicId);
    res.status(200).json({ success: true, message: "Patient removed from queue" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error cancelling patient" });
  }
};

// NEW: SECURED ACTION: Receptionist Edits a Patient
export const editPatient = async (req, res) => {
  try {
    if (req.user.role !== 'receptionist') return res.status(403).json({ message: "Only receptionists can edit details." });
    
    const { patientId } = req.params;
    const { name, mobile } = req.body;
    
    await Patient.findByIdAndUpdate(patientId, { name, mobile });
    
    await broadcastClinicState(req.io, req.user.clinicId);
    res.status(200).json({ success: true, message: "Patient updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error editing patient" });
  }
};

// 5. SECURED ACTION: Doctor completes consultation
export const completeConsultation = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const clinic = await Clinic.findById(clinicId);
    
    // Find the patient who is currently being served in this clinic
    const currentPatient = await Patient.findOne({ clinicId, status: 'serving' });
    
    if (currentPatient) {
      currentPatient.status = 'completed';
      currentPatient.completedAt = new Date();
      
      const durationMs = currentPatient.completedAt - (currentPatient.calledAt || currentPatient.joinedAt);
      const durationMins = Math.max(durationMs / 1000 / 60, 1); // Ensure at least 1 min
      currentPatient.consultationDuration = durationMins;
      await currentPatient.save();

      // Recalculate AI average
      clinic.avgConsultationTime = (clinic.avgConsultationTime * 0.7) + (durationMins * 0.3);
      clinic.currentToken = 0; 
      await clinic.save();

      await broadcastClinicState(req.io, clinicId);
      res.status(200).json({ success: true, message: "Consultation completed" });
    } else {
      res.status(400).json({ success: false, message: "No patient is currently being served" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. PUBLIC ACTION: Get current state (TVs and Phones use this)
export const getQueueState = async (req, res) => {
  try {
    // This remains req.query because TVs and Phones don't have login tokens
    const { clinicId } = req.query; 
    if (!clinicId) return res.status(400).json({ message: "Clinic ID required" });

    const clinic = await Clinic.findById(clinicId);
    const waitingList = await Patient.find({ clinicId, status: 'waiting' }).sort({ joinedAt: 1 });
    
    res.status(200).json({
      activeToken: clinic ? clinic.currentToken : 0,
      averageTime: clinic ? clinic.avgConsultationTime.toFixed(1) : 10,
      waitingList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching queue" });
  }
};

// 7. SECURED ACTION: Reset for a new session
export const resetQueue = async (req, res) => {
  try {
    const clinicId = req.user.clinicId; // Pulled from JWT
    const clinic = await Clinic.findById(clinicId);
    
    if (clinic) {
      clinic.currentToken = 0;
      clinic.highestToken = 0;
      await clinic.save();
    }

    await Patient.deleteMany({ clinicId, status: { $in: ['waiting', 'serving'] } });

    await broadcastClinicState(req.io, clinicId);
    res.status(200).json({ success: true, message: "Queue reset for new session" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error resetting queue" });
  }
};
// PUBLIC ACTION: TV Display using Clinic Code
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
      averageTime: clinic.avgConsultationTime.toFixed(1),
      waitingList
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching public queue" });
  }
};
// 8. PUBLIC ACTION: Mobile Tracking API
export const trackPatient = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // Find the exact patient, regardless of their status
    const patient = await Patient.findOne({ trackingId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const clinic = await Clinic.findById(patient.clinicId);
    
    // Calculate how many people are strictly ahead of them
    const peopleAhead = await Patient.countDocuments({
      clinicId: patient.clinicId,
      status: 'waiting',
      joinedAt: { $lt: patient.joinedAt } // Only count people who joined BEFORE them
    });

    res.status(200).json({
      patient,
      clinic: {
        name: clinic.name,
        activeToken: clinic.currentToken,
        averageTime: clinic.avgConsultationTime,
        clinicId: clinic._id
      },
      peopleAhead
    });
  } catch (error) {
    res.status(500).json({ message: "Error tracking patient" });
  }
};