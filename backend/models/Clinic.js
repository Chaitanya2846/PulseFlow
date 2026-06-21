import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  clinicCode: { type: String, required: true, unique: true },
  currentToken: { type: Number, default: 0 },
  highestToken: { type: Number, default: 0 },
  avgConsultationTime: { type: Number, default: 10 },
  currentPatientCalledAt: { type: Date, default: null },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Clinic', clinicSchema);