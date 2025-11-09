import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db/prisma';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const couple = await prisma.couple.findUnique({
      where: { username }
    });

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
      userId: couple.id,
      role: 'couple',
      coupleId: couple.id
    });

    return NextResponse.json({
      token,
      role: 'couple',
      couple: {
        id: couple.id,
        name: couple.name,
        email: couple.email,
        eventTitle: couple.eventTitle
      }
    });
  } catch (error: any) {
    console.error('[Couple Login Error]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return user-friendly error message
    return NextResponse.json(
      { message: 'Unable to process login request. Please try again later.' },
      { status: 500 }
    );
  }
}
