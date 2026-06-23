import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null // Required by BullMQ
};

export const connection = new Redis(redisConfig);

connection.on('connect', () => console.log('🟢 Redis Connected Successfully'));
connection.on('error', (err) => console.error('🔴 Redis Connection Error:', err));