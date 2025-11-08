# WebSocket Real-Time Updates Setup Guide

This guide explains how to set up and use real-time updates in your Wedding RSVP application using Socket.IO.

## Architecture

The WebSocket implementation consists of three parts:

1. **Socket.IO Server** (`lib/socket/server.ts`) - Standalone server running on port 3001
2. **Socket Client Utility** (`lib/socket/client.ts`) - Used by API routes to emit events
3. **React Hook** (`lib/hooks/useSocket.ts`) - Used by frontend components to receive updates

## Setup Instructions

### 1. Install Dependencies (Already Installed)

The required packages are already installed:
- `socket.io` - Server implementation
- `socket.io-client` - Client implementation

### 2. Add Environment Variables

Add to your `.env.local`:

```env
# Socket.IO Server Configuration
SOCKET_PORT=3001
SOCKET_URL=http://localhost:3001

# For client-side (must have NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Install tsx for Running TypeScript Server

```bash
npm install --save-dev tsx --legacy-peer-deps
```

### 4. Add Socket Server Script to package.json

Add this script to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "socket": "tsx lib/socket/server.ts",
    "dev:full": "concurrently \"npm run dev\" \"npm run socket\""
  }
}
```

Optionally install concurrently to run both servers at once:

```bash
npm install --save-dev concurrently --legacy-peer-deps
```

### 5. Start the Servers

**Option A: Run separately**
```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start Socket server
npm run socket
```

**Option B: Run together (if you installed concurrently)**
```bash
npm run dev:full
```

## Usage in Components

### Example: Guest List with Real-Time Updates

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/lib/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';

export default function GuestList() {
  const [guests, setGuests] = useState([]);
  const { coupleId } = useAuth();

  // Connect to WebSocket and listen for updates
  const { isConnected } = useSocket(
    { coupleId, enabled: true },
    {
      onGuestAdded: (newGuest) => {
        console.log('New guest added:', newGuest);
        setGuests(prev => [...prev, newGuest]);
      },

      onGuestUpdated: (updatedGuest) => {
        console.log('Guest updated:', updatedGuest);
        setGuests(prev =>
          prev.map(g => g._id === updatedGuest._id ? updatedGuest : g)
        );
      },

      onGuestDeleted: ({ _id }) => {
        console.log('Guest deleted:', _id);
        setGuests(prev => prev.filter(g => g._id !== _id));
      },

      onGuestVerified: (verifiedGuest) => {
        console.log('Guest verified:', verifiedGuest);
        setGuests(prev =>
          prev.map(g => g._id === verifiedGuest._id ? verifiedGuest : g)
        );
      },

      onRSVPConfirmed: (guest) => {
        console.log('RSVP confirmed:', guest);
        setGuests(prev =>
          prev.map(g => g._id === guest._id ? guest : g)
        );
      }
    }
  );

  return (
    <div>
      <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      {/* Your guest list UI */}
    </div>
  );
}
```

## Usage in API Routes

### Example: Add Guest with Real-Time Update

```tsx
// app/api/admin/add-guest/route.ts
import { emitGuestAdded } from '@/lib/socket/client';

export async function POST(request: NextRequest) {
  // ... existing code to create guest ...

  const newGuest = await Guest.create({
    name,
    phoneNumber,
    couple: coupleId,
    // ... other fields
  });

  // Emit WebSocket event to notify all connected clients
  await emitGuestAdded(coupleId, newGuest);

  return NextResponse.json(newGuest, { status: 201 });
}
```

### Available Socket Client Functions

```ts
import {
  emitGuestAdded,
  emitGuestUpdated,
  emitGuestDeleted,
  emitGuestVerified,
  emitRSVPConfirmed
} from '@/lib/socket/client';

// Use in your API routes after database operations
await emitGuestAdded(coupleId, guest);
await emitGuestUpdated(coupleId, guest);
await emitGuestDeleted(coupleId, guestId);
await emitGuestVerified(coupleId, guest);
await emitRSVPConfirmed(coupleId, guest);
```

## Integration Checklist

To fully integrate WebSocket updates, add the `useSocket` hook to these pages:

- [ ] **Dashboard** (`app/dashboard/page.tsx`) - Real-time stats updates
- [ ] **Guest List** (`app/guests/page.tsx`) - Live guest list updates
- [ ] **Verify Guest** (`app/verify/page.tsx`) - Verification status updates
- [ ] **Home Page** (`app/page.tsx`) - New guest notifications

And emit events from these API routes:

- [ ] `app/api/admin/add-guest/route.ts` - Emit `guest:added`
- [ ] `app/api/admin/guests/[id]/route.ts` (PUT) - Emit `guest:updated`
- [ ] `app/api/admin/delete/[phoneNumber]/route.ts` - Emit `guest:deleted`
- [ ] `app/api/admin/verify-guest/route.ts` - Emit `guest:verified`
- [ ] `app/api/admin/confirm-rsvp/[uniqueId]/route.ts` - Emit `rsvp:confirmed`

## Troubleshooting

### Socket Server Won't Start

**Error:** `Cannot find module 'tsx'`
```bash
npm install --save-dev tsx --legacy-peer-deps
```

### Client Can't Connect

1. Check that socket server is running on port 3001
2. Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
3. Check browser console for connection errors
4. Ensure firewall allows port 3001

### Events Not Being Received

1. Check that the couple ID is being passed correctly
2. Verify the client has joined the couple room
3. Check socket server logs for incoming events
4. Make sure API routes are calling emit functions

## Production Deployment

For production:

1. Set `SOCKET_URL` to your production socket server URL
2. Set `NEXT_PUBLIC_SOCKET_URL` to the public-facing socket URL
3. Deploy socket server separately or use a process manager like PM2
4. Use NGINX or similar for WebSocket proxying
5. Enable HTTPS for secure WebSocket connections (wss://)

### Example Production Configuration

```env
# Server-side
SOCKET_URL=https://socket.yourdomain.com
SOCKET_PORT=3001

# Client-side
NEXT_PUBLIC_SOCKET_URL=wss://socket.yourdomain.com
```

## Benefits

✅ **Real-time guest list updates** - See new guests instantly
✅ **Live verification status** - Track check-ins as they happen
✅ **RSVP notifications** - Get notified when guests confirm
✅ **Multi-user collaboration** - Multiple admins see the same data
✅ **Better UX** - No need to manually refresh pages

## Optional Enhancements

1. **Add authentication** to socket connections
2. **Implement presence indicators** (show who's online)
3. **Add typing indicators** for notes/comments
4. **Create activity feed** showing recent actions
5. **Add sound notifications** for important events
