import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized - Admin only' }, { status: 403 });
    }

    await dbConnect();

    // Update all guests where plusOneAllowed is undefined or doesn't exist
    const result = await Guest.updateMany(
      {
        $or: [
          { plusOneAllowed: { $exists: false } },
          { plusOneAllowed: null }
        ]
      },
      { $set: { plusOneAllowed: false } }
    );

    // Get counts
    const totalGuests = await Guest.countDocuments();
    const withPlusOne = await Guest.countDocuments({ plusOneAllowed: true });
    const withoutPlusOne = await Guest.countDocuments({ plusOneAllowed: false });

    return NextResponse.json({
      message: 'Fixed plusOneAllowed field',
      updated: result.modifiedCount,
      stats: {
        total: totalGuests,
        withPlusOne,
        withoutPlusOne
      }
    });
  } catch (error: any) {
    console.error('Fix plusOne error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
