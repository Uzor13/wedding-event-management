import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { uniqueId, code, coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    const filter: any = {
      $or: [{ uniqueId }, { code }]
    };

    if (coupleId) {
      filter.couple = coupleId;
    }

    const guest = await Guest.findOne(filter);

    if (!guest) {
      return NextResponse.json(
        { success: false, message: 'Guest not found' },
        { status: 401 }
      );
    }

    if (guest.isUsed) {
      return NextResponse.json(
        { success: false, message: 'This code has already been used' },
        { status: 400 }
      );
    }

    guest.isUsed = true;
    guest.rsvpStatus = true;
    await guest.save();

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      guestName: guest.name
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
