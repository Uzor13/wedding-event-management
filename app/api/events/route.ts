import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const events = await prisma.event.findMany({
      where: { coupleId },
      include: {
        guests: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            rsvpStatus: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

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

    const event = await prisma.event.create({
      data: {
        coupleId,
        eventName,
        eventType,
        date,
        time,
        venueName,
        venueAddress,
        description,
        dressCode,
        isMainEvent: isMainEvent || false,
        guests: guestList && guestList.length > 0 ? {
          connect: guestList.map((guestId: string) => ({ id: guestId }))
        } : undefined
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint violation' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
