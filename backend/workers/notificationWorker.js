import { Worker } from 'bullmq';
import { connection } from '../config/redis.js';
import { sendSMS } from '../services/smsService.js';

console.log("👷 Notification Worker Started...");

const notificationWorker = new Worker('notificationQueue', async job => {
  const { type, patientId, patientName, phoneNumber, tokenNumber, trackingLink, patientsAhead } = job.data;

  let message = "";

  switch (type) {
    case 'REGISTRATION':
      message = `Queue Cure\n\nHello ${patientName},\nYour token number is A-${tokenNumber}.\n\nTrack your live queue status here:\n${trackingLink}\n\nThank you.`;
      break;
      
    case 'TURN_ALERT':
      message = `Queue Cure\n\nOnly ${patientsAhead} patients remain before your turn (Token A-${tokenNumber}).\n\nPlease be ready near the cabin.`;
      break;

    case 'RECALL_ALERT':
      message = `Queue Cure\n\nToken A-${tokenNumber} was called but you were unavailable.\n\nYour position is saved in the Recall Queue. Please contact reception immediately.`;
      break;

    default:
      console.warn(`Unknown job type: ${type}`);
      return;
  }

  // Await the SMS Provider (will retry automatically if this throws)
  await sendSMS(phoneNumber, message);
  
}, { connection });

notificationWorker.on('completed', job => {
  console.log(`✅ Job ${job.id} [${job.data.type}] completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} [${job.data.type}] failed:`, err.message);
});

export default notificationWorker;