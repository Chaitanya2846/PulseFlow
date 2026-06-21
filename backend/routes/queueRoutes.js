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
  trackPatient,
  getPublicQueueState,
  resetQueue ,
  cancelPatient,
  editPatient
} from '../controllers/queueController.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
// Anyone can hit these endpoints to create accounts or view the public queue
router.post('/register/doctor', registerDoctor);
router.post('/register/receptionist', registerReceptionist);
router.post('/login', loginClinic);
router.get('/state', getQueueState); 
router.get('/public/:clinicCode', getPublicQueueState);
router.get('/track/:trackingId', trackPatient);
// --- SECURED ROUTES ---
// The verifyToken middleware ensures the user has a valid JWT before allowing the action
router.post('/add', verifyToken, addPatient);
router.put('/advance', verifyToken, callNext);              
router.put('/complete', verifyToken, completeConsultation); 
router.post('/reset', verifyToken, resetQueue); 
router.delete('/cancel/:patientId', verifyToken, cancelPatient); // <-- ADD THIS
router.put('/edit/:patientId', verifyToken, editPatient);        // <-- ADD THIS            

export default router;