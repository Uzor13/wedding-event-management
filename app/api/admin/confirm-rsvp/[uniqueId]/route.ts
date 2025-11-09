import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { uniqueId } = await params;
    const { coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    const filter: any = { uniqueId };
    if (coupleId) {
      filter.coupleId = coupleId;
    }

    const guest = await prisma.guest.findFirst({
      where: filter
    });

    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    if (guest.isUsed) {
      return NextResponse.json(
        { success: false, message: 'This QR code has already been scanned' },
        { status: 400 }
      );
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        isUsed: true,
        rsvpStatus: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'RSVP and verification successful',
      guestName: updatedGuest.name
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
