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

    // Track if already used BEFORE updating
    const wasAlreadyUsed = guest.isUsed;

    if (wasAlreadyUsed) {
      // Populate tags even for already-used guests
      await guest.populate('tags');

      return NextResponse.json({
        success: true,
        message: 'This guest has already been verified',
        name: guest.name,
        phoneNumber: guest.phoneNumber,
        code: guest.code,
        uniqueId: guest.uniqueId,
        rsvpStatus: guest.rsvpStatus,
        isUsed: true,
        tags: guest.tags?.map((tag: any) => ({
          name: tag.name,
          color: tag.color
        })) || []
      });
    }

    guest.isUsed = true;
    guest.rsvpStatus = true;
    await guest.save();

    // Populate tags to include in response
    await guest.populate('tags');

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      name: guest.name,
      phoneNumber: guest.phoneNumber,
      code: guest.code,
      uniqueId: guest.uniqueId,
      rsvpStatus: guest.rsvpStatus,
      isUsed: false, // Return false on first scan for proper UI feedback
      tags: guest.tags?.map((tag: any) => ({
        name: tag.name,
        color: tag.color
      })) || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
