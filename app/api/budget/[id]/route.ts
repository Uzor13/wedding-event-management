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
    const { category, itemName, vendor, estimatedCost, actualCost, paid, paidDate, notes } = await request.json();

    const item = await prisma.budgetItem.update({
      where: { id },
      data: {
        category,
        itemName,
        vendor: vendor || undefined,
        estimatedCost: estimatedCost || undefined,
        actualCost: actualCost || undefined,
        paid,
        paidDate: paid && !paidDate ? new Date() : (paidDate ? new Date(paidDate) : undefined),
        notes: notes || undefined
      }
    });

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Budget item not found' }, { status: 404 });
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

    await prisma.budgetItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Budget item deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Budget item not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
