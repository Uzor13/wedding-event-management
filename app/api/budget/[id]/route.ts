import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BudgetItem from '@/lib/models/Budget';
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

    await dbConnect();
    const { id } = await params;

    const { category, itemName, vendor, estimatedCost, actualCost, paid, paidDate, notes } = await request.json();

    const item = await BudgetItem.findByIdAndUpdate(
      id,
      {
        category,
        itemName,
        vendor,
        estimatedCost,
        actualCost,
        paid,
        paidDate: paid && !paidDate ? new Date() : paidDate,
        notes
      },
      { new: true }
    );

    if (!item) {
      return NextResponse.json({ message: 'Budget item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
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

    await dbConnect();
    const { id } = await params;

    const item = await BudgetItem.findByIdAndDelete(id);

    if (!item) {
      return NextResponse.json({ message: 'Budget item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Budget item deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
