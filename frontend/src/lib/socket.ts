import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

// Lazily create (and re-auth) the socket connection using the current access token.
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  socket?.disconnect();
  socket = io(API_URL, {
    auth: { token: getAccessToken() },
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
