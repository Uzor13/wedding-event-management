import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { coupleId, guestName, email, message } = await request.json();

    if (!coupleId || !guestName || !message) {
      return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        coupleId,
        guestName,
        // Note: email field removed - not in Prisma schema
        message,
        approved: false,
        featured: false
      }
    });

    return NextResponse.json({ success: true, message: 'Message submitted successfully!' }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting message:', error);
    return NextResponse.json({ error: 'Failed to submit message. Please try again.' }, { status: 400 });
  }
}
