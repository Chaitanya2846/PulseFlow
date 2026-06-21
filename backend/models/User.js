import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Dr Sharma" or "Priya"
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  role: { type: String, enum: ['receptionist', 'doctor'], required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true }
});

export default mongoose.model('User', userSchema);