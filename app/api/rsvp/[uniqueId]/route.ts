import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;

    const guest = await prisma.guest.findFirst({
      where: { uniqueId },
      include: {
        couple: true,
        tags: true
      }
    });

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    const settings = await prisma.setting.findFirst({
      where: { coupleId: guest.coupleId }
    });

    return NextResponse.json({
      ...guest,
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
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;

    const guest = await prisma.guest.findFirst({
      where: { uniqueId }
    });

    if (!guest) {
      return NextResponse.json(
        { message: 'No guest found', success: false },
        { status: 404 }
      );
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guest.id },
      data: { rsvpStatus: true }
    });

    return NextResponse.json({
      guest: updatedGuest,
      success: true
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message, success: false },
      { status: 500 }
    );
  }
}
