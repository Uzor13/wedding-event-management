import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import GiftRegistry from '@/lib/models/GiftRegistry';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const items = await GiftRegistry.find({ couple: coupleId }).sort({ priority: -1, createdAt: -1 });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const {
      itemName,
      category,
      description,
      price,
      quantity,
      purchaseLink,
      imageUrl,
      priority,
      coupleId: bodyCoupleId
    } = await request.json();

    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const item = new GiftRegistry({
      couple: coupleId,
      itemName,
      category,
      description,
      price,
      quantity: quantity || 1,
      quantityReceived: 0,
      purchaseLink,
      imageUrl,
      priority: priority || 'medium'
    });

    await item.save();
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
