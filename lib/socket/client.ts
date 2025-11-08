/**
 * Socket Client Utility for API Routes
 *
 * This module provides functions to emit socket events from API routes.
 * It connects to the standalone Socket.IO server.
 *
 * Usage in API routes:
 * ```ts
 * import { emitGuestAdded } from '@/lib/socket/client';
 *
 * // After creating a guest
 * await emitGuestAdded(coupleId, newGuest);
 * ```
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001';

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3
    });

    socket.on('connect', () => {
      console.log('[Socket Client] Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('[Socket Client] Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket Client] Connection error:', err.message);
    });
  }

  return socket;
}

/**
 * Emit a guest added event to all clients in the couple's room
 */
export async function emitGuestAdded(coupleId: string, guest: any): Promise<void> {
  try {
    const socket = getSocket();
    socket.emit('guest:added:broadcast', { coupleId, guest });
  } catch (error) {
    console.error('[Socket Client] Failed to emit guest:added:', error);
  }
}

/**
 * Emit a guest updated event to all clients in the couple's room
 */
export async function emitGuestUpdated(coupleId: string, guest: any): Promise<void> {
  try {
    const socket = getSocket();
    socket.emit('guest:updated:broadcast', { coupleId, guest });
  } catch (error) {
    console.error('[Socket Client] Failed to emit guest:updated:', error);
  }
}

/**
 * Emit a guest deleted event to all clients in the couple's room
 */
export async function emitGuestDeleted(coupleId: string, guestId: string): Promise<void> {
  try {
    const socket = getSocket();
    socket.emit('guest:deleted:broadcast', { coupleId, guestId });
  } catch (error) {
    console.error('[Socket Client] Failed to emit guest:deleted:', error);
  }
}

/**
 * Emit a guest verified event to all clients in the couple's room
 */
export async function emitGuestVerified(coupleId: string, guest: any): Promise<void> {
  try {
    const socket = getSocket();
    socket.emit('guest:verified:broadcast', { coupleId, guest });
  } catch (error) {
    console.error('[Socket Client] Failed to emit guest:verified:', error);
  }
}

/**
 * Emit an RSVP confirmed event to all clients in the couple's room
 */
export async function emitRSVPConfirmed(coupleId: string, guest: any): Promise<void> {
  try {
    const socket = getSocket();
    socket.emit('rsvp:confirmed:broadcast', { coupleId, guest });
  } catch (error) {
    console.error('[Socket Client] Failed to emit rsvp:confirmed:', error);
  }
}

/**
 * Close the socket connection (call this when shutting down the server)
 */
export function closeSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}
