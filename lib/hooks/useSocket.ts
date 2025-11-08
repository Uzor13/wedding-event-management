import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  coupleId?: string | null;
  enabled?: boolean;
}

interface SocketEvents {
  onGuestAdded?: (guest: any) => void;
  onGuestUpdated?: (guest: any) => void;
  onGuestDeleted?: (data: { _id: string }) => void;
  onGuestVerified?: (guest: any) => void;
  onRSVPConfirmed?: (guest: any) => void;
}

/**
 * Hook for connecting to WebSocket server and receiving real-time updates
 *
 * @param options - Configuration options
 * @param events - Event handlers for different socket events
 *
 * @example
 * ```tsx
 * const { isConnected } = useSocket(
 *   { coupleId, enabled: true },
 *   {
 *     onGuestAdded: (guest) => {
 *       console.log('New guest added:', guest);
 *       setGuests(prev => [...prev, guest]);
 *     },
 *     onGuestUpdated: (guest) => {
 *       setGuests(prev => prev.map(g => g._id === guest._id ? guest : g));
 *     },
 *     onGuestDeleted: ({ _id }) => {
 *       setGuests(prev => prev.filter(g => g._id !== _id));
 *     }
 *   }
 * );
 * ```
 */
export function useSocket(
  options: UseSocketOptions,
  events: SocketEvents = {}
) {
  const { coupleId, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't connect if disabled or no couple ID
    if (!enabled || !coupleId) {
      return;
    }

    // Socket server URL (separate from Next.js app)
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    try {
      // Create socket connection
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsConnected(true);
        setError(null);

        // Join couple-specific room
        socket.emit('join:couple', coupleId);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      // Register event handlers
      if (events.onGuestAdded) {
        socket.on('guest:added', events.onGuestAdded);
      }

      if (events.onGuestUpdated) {
        socket.on('guest:updated', events.onGuestUpdated);
      }

      if (events.onGuestDeleted) {
        socket.on('guest:deleted', events.onGuestDeleted);
      }

      if (events.onGuestVerified) {
        socket.on('guest:verified', events.onGuestVerified);
      }

      if (events.onRSVPConfirmed) {
        socket.on('rsvp:confirmed', events.onRSVPConfirmed);
      }

      // Cleanup on unmount
      return () => {
        if (socket) {
          socket.emit('leave:couple', coupleId);
          socket.off('connect');
          socket.off('disconnect');
          socket.off('connect_error');
          socket.off('guest:added');
          socket.off('guest:updated');
          socket.off('guest:deleted');
          socket.off('guest:verified');
          socket.off('rsvp:confirmed');
          socket.close();
        }
      };
    } catch (err: any) {
      console.error('Failed to create socket connection:', err);
      setError(err.message);
    }
  }, [coupleId, enabled]);

  return {
    isConnected,
    error,
    socket: socketRef.current
  };
}
