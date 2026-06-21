import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  tokenNumber: { type: Number, required: true },
  trackingId: { type: String, required: true, unique: true }, // The PF-8342 code
  name: { type: String, required: true },
  mobile: { type: String }, // New field
  status: { type: String, enum: ['waiting', 'serving', 'completed', 'skipped'], default: 'waiting' },
  joinedAt: { type: Date, default: Date.now },
  calledAt: { type: Date },
  completedAt: { type: Date },
  consultationDuration: { type: Number } 
});

patientSchema.index({ clinicId: 1, status: 1 });
export default mongoose.model('Patient', patientSchema);