import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import queueRoutes from './routes/queueRoutes.js';

// ==========================================
// NEW: BULLMQ WORKER & QUEUE IMPORTS
// ==========================================
// Importing the worker automatically starts it in the background thread
import './workers/notificationWorker.js';
import { notificationQueue } from './queues/notificationQueue.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  },
  transports: ['websocket', 'polling'] // Explicitly allow websocket first
});

// Pass the 'io' instance to req object so controllers can broadcast
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/queue', queueRoutes);

// ==========================================
// NEW: BULLMQ QUEUE MONITORING ENDPOINT
// ==========================================
// This allows you (or judges) to see background job processing in real-time
app.get('/api/admin/queue-stats', async (req, res) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      notificationQueue.getWaitingCount(),
      notificationQueue.getActiveCount(),
      notificationQueue.getCompletedCount(),
      notificationQueue.getFailedCount()
    ]);

    res.status(200).json({ waiting, active, completed, failed });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Socket Listeners
io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  // When any client connects, they must join their specific clinic's room
  socket.on('join_clinic_room', (clinicId) => {
    socket.join(clinicId);
    console.log(`[Socket] Client ${socket.id} joined room: ${clinicId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB Connection Error:', err));