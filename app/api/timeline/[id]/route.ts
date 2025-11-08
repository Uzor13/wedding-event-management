import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import TimelineItem from '@/lib/models/Timeline';
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

    const { title, description, time, duration, category, order } = await request.json();

    const item = await TimelineItem.findByIdAndUpdate(
      id,
      { title, description, time, duration, category, order },
      { new: true }
    );

    if (!item) {
      return NextResponse.json({ message: 'Timeline item not found' }, { status: 404 });
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

    const item = await TimelineItem.findByIdAndDelete(id);

    if (!item) {
      return NextResponse.json({ message: 'Timeline item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Timeline item deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
