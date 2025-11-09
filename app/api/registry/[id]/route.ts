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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const {
      itemName,
      category,
      description,
      price,
      quantity,
      quantityReceived,
      purchaseLink,
      imageUrl,
      priority
    } = await request.json();

    const item = await prisma.giftRegistry.update({
      where: { id },
      data: {
        itemName,
        category,
        description,
        price,
        quantity,
        quantityReceived,
        purchaseLink,
        imageUrl,
        priority
      }
    });

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Gift item not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint violation' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.giftRegistry.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Gift item deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Gift item not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
