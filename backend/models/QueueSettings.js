import mongoose from 'mongoose';

const queueSettingsSchema = new mongoose.Schema({
  clinicId: { type: String, default: 'default_clinic' },
  currentToken: { type: Number, default: 0 },
  highestToken: { type: Number, default: 0 },
  avgConsultationTime: { type: Number, default: 10 }, // 10 minutes cold start
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('QueueSettings', queueSettingsSchema);