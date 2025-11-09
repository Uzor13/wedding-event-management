import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const {
      eventName,
      eventType,
      date,
      time,
      venueName,
      venueAddress,
      description,
      dressCode,
      guestList,
      isMainEvent
    } = await request.json();

    const event = await prisma.event.update({
      where: { id },
      data: {
        eventName,
        eventType,
        date,
        time,
        venueName,
        venueAddress,
        description,
        dressCode,
        isMainEvent,
        guests: guestList ? {
          set: guestList.map((guestId: string) => ({ id: guestId }))
        } : undefined
      },
      include: {
        guests: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            rsvpStatus: true
          }
        }
      }
    });

    return NextResponse.json(event);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint violation' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
