import express from 'express';
// Look at the line below: resetQueue MUST be imported here!
import { addPatient, callNext, getQueueState, resetQueue } from '../controllers/queueController.js';

const router = express.Router();

router.post('/add', addPatient);
router.put('/advance', callNext);
router.get('/state', getQueueState);
router.post('/reset', resetQueue);

export default router;