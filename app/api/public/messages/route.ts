import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Message from '@/lib/models/Message';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { coupleId, guestName, email, message } = await request.json();

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
    return NextResponse.json({ success: true, message: 'Message submitted successfully!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
