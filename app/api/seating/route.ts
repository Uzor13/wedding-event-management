import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
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

    const guests = await Guest.find({ couple: coupleId })
      .select('name phoneNumber tableNumber seatNumber plusOneAllowed plusOneName rsvpStatus')
      .sort({ tableNumber: 1, seatNumber: 1 });

    return NextResponse.json(guests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
