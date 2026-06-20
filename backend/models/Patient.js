import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  name: { type: String, required: true },
  priority: { type: String, enum: ['Normal', 'Senior Citizen', 'Emergency'], default: 'Normal' },
  status: { type: String, enum: ['waiting', 'serving', 'completed', 'skipped'], default: 'waiting' },
  joinedAt: { type: Date, default: Date.now },
  calledAt: { type: Date },
  completedAt: { type: Date },
  consultationDuration: { type: Number } 
});

export default mongoose.model('Patient', patientSchema);