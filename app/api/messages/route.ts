import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Message from '@/lib/models/Message';
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

    const messages = await Message.find({ couple: coupleId }).sort({ createdAt: -1 });
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { guestName, email, message, coupleId } = await request.json();

    if (!coupleId || !guestName || !message) {
      return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });
    }

    const newMessage = new Message({
      couple: coupleId,
      guestName,
      email,
      message,
      approved: false,
      featured: false
    });

    await newMessage.save();
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
