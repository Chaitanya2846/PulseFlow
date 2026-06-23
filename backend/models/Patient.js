import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  tokenNumber: { type: Number, required: true },
  trackingId: { type: String, required: true, unique: true }, // The PF-8342 code
  name: { type: String, required: true },
  mobile: { type: String }, 
  
  // NEW: Priority field for the Triage Engine
  priority: { 
    type: String, 
    enum: ['Normal', 'High', 'Emergency'], 
    default: 'Normal' 
  },
  
  status: { type: String, enum: ['waiting', 'serving', 'completed', 'skipped', 'cancelled'], default: 'waiting' },
  
  // Tracks how many times this patient was unavailable when called
  skipCount: { type: Number, default: 0 }, 
  
  joinedAt: { type: Date, default: Date.now },
  calledAt: { type: Date },
  completedAt: { type: Date },
  consultationDuration: { type: Number } 
});

// Compound index for ultra-low latency lookups during real-time broadcasts
patientSchema.index({ clinicId: 1, status: 1 });

export default mongoose.model('Patient', patientSchema);