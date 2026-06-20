import { io } from 'socket.io-client';

// This connects your React frontend to your Node/Express backend
const URL = `http://${window.location.hostname}:5000`;

export const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket'] // Crucial for the hackathon edge cases!
});