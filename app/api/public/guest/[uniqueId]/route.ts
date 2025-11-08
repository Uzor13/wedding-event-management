import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import Event from '@/lib/models/Event';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    await dbConnect();
    const { uniqueId } = await params;

    const guest = await Guest.findOne({ uniqueId })
      .select('name phoneNumber uniqueId rsvpStatus plusOneAllowed plusOneName plusOnePhone plusOneRsvp mealPreference plusOneMealPreference dietaryRestrictions plusOneDietaryRestrictions couple')
      .populate('couple', '_id name1 name2 weddingDate');

    if (!guest) {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }

    // Get events for this couple
    const events = await Event.find({
      couple: guest.couple,
      guestList: guest._id
    }).select('eventName eventType date time venueName venueAddress dressCode isMainEvent');

    return NextResponse.json({ guest, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    await dbConnect();
    const { uniqueId } = await params;

    const {
      rsvpStatus,
      plusOneName,
      plusOnePhone,
      plusOneRsvp,
      mealPreference,
      plusOneMealPreference,
      dietaryRestrictions,
      plusOneDietaryRestrictions
    } = await request.json();

    const guest = await Guest.findOneAndUpdate(
      { uniqueId },
      {
        rsvpStatus,
        plusOneName,
        plusOnePhone,
        plusOneRsvp,
        mealPreference,
        plusOneMealPreference,
        dietaryRestrictions,
        plusOneDietaryRestrictions
      },
      { new: true }
    ).select('name rsvpStatus plusOneAllowed plusOneName plusOneRsvp');

    if (!guest) {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json(guest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
