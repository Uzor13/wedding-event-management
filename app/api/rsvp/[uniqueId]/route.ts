import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import Setting from '@/lib/models/Setting';

export async function GET(
  request: NextRequest,
  { params }: { params: { uniqueId: string } }
) {
  try {
    await dbConnect();

    const { uniqueId } = params;

    const guest = await Guest.findOne({ uniqueId })
      .populate('couple')
      .populate('tags');

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    const settings = await Setting.findOne({ couple: guest.couple });

    return NextResponse.json({
      ...guest.toObject(),
      settings
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { uniqueId: string } }
) {
  try {
    await dbConnect();

    const { uniqueId } = params;

    const guest = await Guest.findOne({ uniqueId });

    if (!guest) {
      return NextResponse.json(
        { message: 'No guest found', success: false },
        { status: 404 }
      );
    }

    guest.rsvpStatus = true;
    await guest.save();

    return NextResponse.json({
      guest,
      success: true
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message, success: false },
      { status: 500 }
    );
  }
}
