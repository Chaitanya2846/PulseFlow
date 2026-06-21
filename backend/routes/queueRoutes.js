import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { 
  registerDoctor,
  registerReceptionist, 
  loginClinic, 
  addPatient, 
  callNext, 
  completeConsultation, 
  getQueueState,
  updateAverageTime,
  trackPatient,
  getPublicQueueState,
  resetQueue,
  cancelPatient,
  editPatient
} from '../controllers/queueController.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (No Token Required)
// ==========================================
// Anyone can hit these endpoints to create accounts or log in
router.post('/register/doctor', registerDoctor);
router.post('/register/receptionist', registerReceptionist);
router.post('/login', loginClinic);

// ==========================================
// 2. PUBLIC READ-ONLY ROUTES (Phones & TVs)
// ==========================================
// Fetches live data without requiring a login token
router.get('/state', getQueueState); 
router.get('/public/:clinicCode', getPublicQueueState);
router.get('/track/:trackingId', trackPatient);

// ==========================================
// 3. SECURED ROUTES (Must be logged in)
// ==========================================
// The verifyToken middleware ensures valid JWT before allowing the action

// Receptionist Actions
router.post('/add', verifyToken, addPatient);
router.put('/edit/:patientId', verifyToken, editPatient);        
router.delete('/cancel/:patientId', verifyToken, cancelPatient); 
router.post('/reset', verifyToken, resetQueue); 
router.put('/settings/time', verifyToken, updateAverageTime);

// Doctor Actions
router.put('/advance', verifyToken, callNext);              
router.put('/complete', verifyToken, completeConsultation); 

export default router;