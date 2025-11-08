import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Event from '@/lib/models/Event';
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

    await dbConnect();
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

    const event = await Event.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true }
    ).populate('guestList', 'name phoneNumber rsvpStatus');

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
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

    await dbConnect();
    const { id } = await params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
