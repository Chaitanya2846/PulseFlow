import { io } from 'socket.io-client';

// Forcing 'websocket' skips the standard HTTP long-polling handshake
// This cuts cross-screen broadcast latency down to ~20-50ms.
export const socket = io(`http://${window.location.hostname}:5000`, {
  transports: ['websocket'],
  upgrade: false 
});