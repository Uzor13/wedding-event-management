/**
 * WebSocket Server for Real-time Updates
 *
 * This is a standalone Socket.IO server that runs separately from the Next.js app.
 *
 * To run this server:
 * 1. Add a script to package.json: "socket-server": "tsx lib/socket/server.ts"
 * 2. Run: npm run socket-server
 * 3. The socket server will run on port 3001 (or SOCKET_PORT env variable)
 *
 * Events emitted:
 * - guest:added - When a new guest is added
 * - guest:updated - When a guest is updated
 * - guest:deleted - When a guest is deleted
 * - guest:verified - When a guest is verified at event
 * - rsvp:confirmed - When a guest confirms RSVP
 */

import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.SOCKET_PORT || 3001;
const CORS_ORIGIN = process.env.NEXT_PUBLIC_SITE_LINK || 'http://localhost:3000';

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected clients by couple ID
const connectedClients = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a couple-specific room
  socket.on('join:couple', (coupleId: string) => {
    socket.join(`couple:${coupleId}`);

    if (!connectedClients.has(coupleId)) {
      connectedClients.set(coupleId, new Set());
    }
    connectedClients.get(coupleId)?.add(socket.id);

    console.log(`Client ${socket.id} joined couple room: ${coupleId}`);
    console.log(`Total clients in couple ${coupleId}: ${connectedClients.get(coupleId)?.size}`);
  });

  // Leave couple room
  socket.on('leave:couple', (coupleId: string) => {
    socket.leave(`couple:${coupleId}`);
    connectedClients.get(coupleId)?.delete(socket.id);

    console.log(`Client ${socket.id} left couple room: ${coupleId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove from all couple rooms
    connectedClients.forEach((clients, coupleId) => {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        console.log(`Client ${socket.id} removed from couple ${coupleId}`);
      }
    });

    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Export functions for emitting events from API routes
export function emitGuestAdded(coupleId: string, guest: any) {
  io.to(`couple:${coupleId}`).emit('guest:added', guest);
}

export function emitGuestUpdated(coupleId: string, guest: any) {
  io.to(`couple:${coupleId}`).emit('guest:updated', guest);
}

export function emitGuestDeleted(coupleId: string, guestId: string) {
  io.to(`couple:${coupleId}`).emit('guest:deleted', { _id: guestId });
}

export function emitGuestVerified(coupleId: string, guest: any) {
  io.to(`couple:${coupleId}`).emit('guest:verified', guest);
}

export function emitRSVPConfirmed(coupleId: string, guest: any) {
  io.to(`couple:${coupleId}`).emit('rsvp:confirmed', guest);
}

// Start the server
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║  Socket.IO Server Running            ║
║  Port: ${PORT}                       ║
║  CORS Origin: ${CORS_ORIGIN}         ║
╚══════════════════════════════════════╝
  `);
});

export { io };
