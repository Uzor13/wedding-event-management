import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;

    const guest = await prisma.guest.findUnique({
      where: { uniqueId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        uniqueId: true,
        code: true,
        rsvpStatus: true,
        plusOneAllowed: true,
        plusOneName: true,
        plusOnePhone: true,
        plusOneRsvp: true,
        mealPreference: true,
        plusOneMealPreference: true,
        dietaryRestrictions: true,
        plusOneDietaryRestrictions: true,
        coupleId: true,
        couple: {
          select: {
            id: true,
            name: true,
            weddingDate: true
          }
        }
      }
    });

    if (!guest) {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }

    // Get events for this couple where this guest is invited
    const events = await prisma.event.findMany({
      where: {
        coupleId: guest.coupleId,
        guests: {
          some: {
            id: guest.id
          }
        }
      },
      select: {
        id: true,
        eventName: true,
        eventType: true,
        date: true,
        time: true,
        venueName: true,
        venueAddress: true,
        dressCode: true,
        isMainEvent: true
      }
    });

    return NextResponse.json({ guest, events });
  } catch (error: any) {
    console.error('[Guest GET Error]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return user-friendly error message
    return NextResponse.json(
      { error: 'Unable to load guest information. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
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

    const guest = await prisma.guest.update({
      where: { uniqueId },
      data: {
        rsvpStatus,
        plusOneName,
        plusOnePhone,
        plusOneRsvp,
        mealPreference,
        plusOneMealPreference,
        dietaryRestrictions,
        plusOneDietaryRestrictions
      },
      select: {
        name: true,
        rsvpStatus: true,
        plusOneAllowed: true,
        plusOneName: true,
        plusOneRsvp: true
      }
    });

    return NextResponse.json(guest);
  } catch (error: any) {
    console.error('[Guest PUT Error]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return user-friendly error messages
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Unable to update RSVP. Please try again later.' },
      { status: 400 }
    );
  }
}
