import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { phoneNumber } = params;
    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    if (auth.role === 'admin' && !coupleId) {
      return NextResponse.json(
        { message: 'coupleId is required' },
        { status: 400 }
      );
    }

    const filter: any = { phoneNumber };
    if (coupleId) {
      filter.couple = coupleId;
    }

    const guest = await Guest.findOneAndDelete(filter);

    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 200,
      message: 'Guest deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Error deleting guest', error: error.message },
      { status: 500 }
    );
  }
}
