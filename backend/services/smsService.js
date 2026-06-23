// Provider Abstraction Layer
import dotenv from 'dotenv';
dotenv.config();

const provider = process.env.SMS_PROVIDER || 'mock';

export const sendSMS = async (phoneNumber, message) => {
  if (!phoneNumber) return;

  try {
    switch (provider) {
      case 'msg91':
        // await msg91Service.send(phoneNumber, message);
        console.log(`[MSG91] Sending to ${phoneNumber}`);
        break;
      case 'twilio':
        // await twilioService.send(phoneNumber, message);
        console.log(`[Twilio] Sending to ${phoneNumber}`);
        break;
      case 'mock':
      default:
        // HACKATHON SAFE MODE: Just log it beautifully
        console.log(`\n========== 📱 MOCK SMS SENT ==========`);
        console.log(`TO: ${phoneNumber}`);
        console.log(`MESSAGE:\n${message}`);
        console.log(`======================================\n`);
        break;
    }
  } catch (error) {
    console.error(`SMS Service Error (${provider}):`, error);
    throw error; // Let BullMQ catch this and trigger a retry
  }
};