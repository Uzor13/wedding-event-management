import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const { name, phoneNumber } = await request.json();

    if (!name || !phoneNumber) {
      return NextResponse.json(
        { message: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    // Build filter
    const filter: any = { _id: id };
    if (coupleId) {
      filter.couple = coupleId;
    }

    // Check if phone number is being changed and if it already exists
    const existingGuest = await Guest.findById(id);
    if (!existingGuest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    if (phoneNumber !== existingGuest.phoneNumber) {
      const duplicatePhone = await Guest.findOne({
        phoneNumber,
        couple: existingGuest.couple,
        _id: { $ne: id }
      });

      if (duplicatePhone) {
        return NextResponse.json(
          { message: 'Phone number already exists for another guest' },
          { status: 400 }
        );
      }
    }

    // Update guest
    const guest = await Guest.findOneAndUpdate(
      filter,
      { name, phoneNumber },
      { new: true }
    ).populate('tags', 'name color');

    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(guest);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    const filter: any = { _id: id };
    if (coupleId) {
      filter.couple = coupleId;
    }

    const guest = await Guest.findOneAndDelete(filter);

    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Guest deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
