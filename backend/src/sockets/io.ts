import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';

let io: SocketServer | null = null;

// Each organization gets its own room, so real-time events never leak across tenants.
function orgRoom(organizationId: string) {
  return `org:${organizationId}`;
}

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Authenticate every socket with the access token, then join its org room.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing token'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.organizationId = payload.organizationId;
      socket.data.userId = payload.userId;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(orgRoom(socket.data.organizationId));
    socket.on('disconnect', () => undefined);
  });

  return io;
}

// Emit an event to everyone currently in the given organization.
export function emitToOrg(organizationId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(orgRoom(organizationId)).emit(event, payload);
}
