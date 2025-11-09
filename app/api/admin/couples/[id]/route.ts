import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db/prisma';
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

    const { id } = await params;
    const { name, email, password, weddingDate } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      email
    };

    if (weddingDate) {
      updateData.weddingDate = new Date(weddingDate);
    }

    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const couple = await prisma.couple.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        weddingDate: true,
        email: true,
        username: true,
        eventTitle: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(couple);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Couple not found' },
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
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // With Prisma cascade deletes, we just delete the couple
    // All related data (guests, tags, settings, etc.) will be deleted automatically
    await prisma.couple.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Couple and all related data deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Couple not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
