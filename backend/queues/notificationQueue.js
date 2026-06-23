import { Queue } from 'bullmq';
import { connection } from '../config/redis.js';

// Reliability Features: 3 Retries, Exponential Backoff, Auto-Cleanup
export const notificationQueue = new Queue('notificationQueue', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, then 2s, then 4s...
    },
    removeOnComplete: true, // Keep Redis memory clean
    removeOnFail: false     // Keep failed jobs for inspection
  }
});