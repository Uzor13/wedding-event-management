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
    const { tagIds } = await request.json();

    if (!Array.isArray(tagIds)) {
      return NextResponse.json(
        { message: 'tagIds must be an array' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    // Check if guest exists and belongs to the couple (if specified)
    const guest = await prisma.guest.findUnique({
      where: { id }
    });

    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    // Check authorization if coupleId is specified
    if (coupleId && guest.coupleId !== coupleId) {
      return NextResponse.json(
        { message: 'Guest not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update guest's tags using Prisma's set operation
    // This will automatically handle the many-to-many relationship
    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: {
        tags: {
          set: tagIds.map((tagId: string) => ({ id: tagId }))
        }
      },
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

    return NextResponse.json(updatedGuest);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
