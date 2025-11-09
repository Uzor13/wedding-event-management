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
    const { name, color } = await request.json();
    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    const where: any = { id };
    if (coupleId) {
      where.coupleId = coupleId;
    }

    const updateData: any = { name };
    if (color) {
      updateData.color = color;
    }

    const tag = await prisma.tag.update({
      where,
      data: updateData,
      include: {
        guests: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!tag) {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tag);
  } catch (error: any) {
    console.error('Error updating tag:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'A tag with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to update tag. Please try again.' },
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

    const where: any = { id };
    if (coupleId) {
      where.coupleId = coupleId;
    }

    const tag = await prisma.tag.delete({
      where
    });

    if (!tag) {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Tag deleted' });
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to delete tag. Please try again.' },
      { status: 500 }
    );
  }
}
