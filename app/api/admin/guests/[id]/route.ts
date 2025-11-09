import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
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

    // Build where clause
    const where: any = { id };
    if (coupleId) {
      where.coupleId = coupleId;
    }

    // Check if guest exists
    const existingGuest = await prisma.guest.findUnique({
      where: { id }
    });

    if (!existingGuest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    // Check authorization if coupleId is specified
    if (coupleId && existingGuest.coupleId !== coupleId) {
      return NextResponse.json(
        { message: 'Guest not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if phone number is being changed and if it already exists
    if (phoneNumber !== existingGuest.phoneNumber) {
      const duplicatePhone = await prisma.guest.findFirst({
        where: {
          phoneNumber,
          coupleId: existingGuest.coupleId,
          id: { not: id }
        }
      });

      if (duplicatePhone) {
        return NextResponse.json(
          { message: 'Phone number already exists for another guest' },
          { status: 400 }
        );
      }
    }

    // Update guest
    const guest = await prisma.guest.update({
      where,
      data: { name, phoneNumber },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json(guest);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Guest not found or unauthorized' },
        { status: 404 }
      );
    }
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    // Build where clause
    const where: any = { id };
    if (coupleId) {
      where.coupleId = coupleId;
    }

    // Check if guest exists and is authorized
    if (coupleId) {
      const guest = await prisma.guest.findUnique({
        where: { id }
      });

      if (!guest || guest.coupleId !== coupleId) {
        return NextResponse.json(
          { message: 'Guest not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    await prisma.guest.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Guest deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Guest not found or unauthorized' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
