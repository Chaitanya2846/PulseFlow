import Patient from '../models/Patient.js';
import QueueSettings from '../models/QueueSettings.js';

// Helper to broadcast state via Socket.io
const broadcastState = async (io) => {
  const settings = await QueueSettings.findOne();
  const waitingList = await Patient.find({ status: 'waiting' }).sort({ joinedAt: 1 });
  
  io.emit('queue_updated', {
    activeToken: settings ? settings.currentToken : 0,
    averageTime: settings ? settings.avgConsultationTime.toFixed(1) : 10,
    waitingList
  });
};

// 1. Add a new patient
export const addPatient = async (req, res) => {
  try {
    let settings = await QueueSettings.findOne();
    if (!settings) {
      settings = new QueueSettings(); // Initialize if empty
    }

    settings.highestToken += 1;
    const newToken = settings.highestToken;

    const newPatient = new Patient({
      tokenNumber: newToken,
      name: req.body.name,
      priority: req.body.priority || 'Normal'
    });

    await newPatient.save();
    await settings.save();

    await broadcastState(req.io);
    res.status(201).json({ success: true, patient: newPatient });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding patient" });
  }
};

// 2. Call Next Patient
export const callNext = async (req, res) => {
  try {
    let settings = await QueueSettings.findOne();
    if (!settings) return res.status(404).json({ message: "Queue settings not found" });

    // Mark current serving patient as completed and calculate duration
    const currentPatient = await Patient.findOne({ tokenNumber: settings.currentToken, status: 'serving' });
    if (currentPatient) {
      currentPatient.status = 'completed';
      currentPatient.completedAt = new Date();
      
      const durationMs = currentPatient.completedAt - currentPatient.calledAt;
      const durationMins = durationMs / 1000 / 60;
      currentPatient.consultationDuration = durationMins;
      await currentPatient.save();

      // Recalculate average (70% history, 30% recent)
      settings.avgConsultationTime = (settings.avgConsultationTime * 0.7) + (durationMins * 0.3);
    }

    // Find next waiting patient
    const nextPatient = await Patient.findOne({ status: 'waiting' }).sort({ joinedAt: 1 });
    if (nextPatient) {
      nextPatient.status = 'serving';
      nextPatient.calledAt = new Date();
      settings.currentToken = nextPatient.tokenNumber;
      await nextPatient.save();
    } else {
      settings.currentToken = 0; // Queue empty
    }

    settings.lastUpdated = new Date();
    await settings.save();

    await broadcastState(req.io);
    res.status(200).json({ success: true, message: "Advanced to next patient" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error calling next patient" });
  }
};

// 3. Get current state (for initial loads)
export const getQueueState = async (req, res) => {
  try {
    const settings = await QueueSettings.findOne();
    const waitingList = await Patient.find({ status: 'waiting' }).sort({ joinedAt: 1 });
    
    res.status(200).json({
      activeToken: settings ? settings.currentToken : 0,
      averageTime: settings ? settings.avgConsultationTime.toFixed(1) : 10,
      waitingList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching queue" });
  }
};
// 4. Reset for a new shift/session
export const resetQueue = async (req, res) => {
  try {
    const settings = await QueueSettings.findOne();
    if (settings) {
      settings.currentToken = 0;
      settings.highestToken = 0;
      // Notice we do NOT reset avgConsultationTime. Keep the AI smart!
      await settings.save();
    }

    // Delete anyone still stuck in the waiting room from the previous shift
    await Patient.deleteMany({ status: { $in: ['waiting', 'serving'] } });

    await broadcastState(req.io);
    res.status(200).json({ success: true, message: "Queue reset for new session" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error resetting queue" });
  }
};