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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const { tableNumber, seatNumber } = await request.json();

    const updateData: any = {};
    if (tableNumber !== undefined) {
      if (tableNumber === '' || tableNumber === null) {
        updateData.tableNumber = null;
      } else {
        const parsed = parseInt(tableNumber);
        updateData.tableNumber = isNaN(parsed) ? null : parsed;
      }
    }
    if (seatNumber !== undefined) {
      if (seatNumber === '' || seatNumber === null) {
        updateData.seatNumber = null;
      } else {
        const parsed = parseInt(seatNumber);
        updateData.seatNumber = isNaN(parsed) ? null : parsed;
      }
    }

    const guest = await Guest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!guest) {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json(guest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
