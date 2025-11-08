import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/db/mongodb';
import Couple from '@/lib/models/Couple';
import Guest from '@/lib/models/Guest';
import Setting from '@/lib/models/Setting';
import Tag from '@/lib/models/Tag';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const { name, email, password } = await request.json();
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    const update: any = { name, email };

    // Only hash and update password if provided
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }

    const couple = await Couple.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).select('-password');

    if (!couple) {
      return NextResponse.json(
        { message: 'Couple not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(couple);
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
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const couple = await Couple.findById(id);
    if (!couple) {
      return NextResponse.json(
        { message: 'Couple not found' },
        { status: 404 }
      );
    }

    // Delete all related data
    await Promise.all([
      Guest.deleteMany({ couple: id }),
      Tag.deleteMany({ couple: id }),
      Setting.deleteOne({ couple: id }),
      Couple.findByIdAndDelete(id)
    ]);

    return NextResponse.json({ message: 'Couple and all related data deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
