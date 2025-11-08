import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/db/mongodb';
import Couple from '@/lib/models/Couple';
import { generateToken } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { username, password } = await request.json();

    const couple = await Couple.findOne({ username });
    if (!couple) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, couple.password);
    if (!match) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: couple._id.toString(),
      role: 'couple',
      coupleId: couple._id.toString()
    });

    return NextResponse.json({
      token,
      role: 'couple',
      couple: {
        id: couple._id.toString(),
        name: couple.name,
        email: couple.email,
        eventTitle: couple.eventTitle
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
