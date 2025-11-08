import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Event from '@/lib/models/Event';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const events = await Event.find({ couple: coupleId })
      .populate('guestList', 'name phoneNumber rsvpStatus')
      .sort({ date: 1, time: 1 });

    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

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
      isMainEvent,
      coupleId: bodyCoupleId
    } = await request.json();

    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const event = new Event({
      couple: coupleId,
      eventName,
      eventType,
      date,
      time,
      venueName,
      venueAddress,
      description,
      dressCode,
      guestList: guestList || [],
      isMainEvent: isMainEvent || false
    });

    await event.save();
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
