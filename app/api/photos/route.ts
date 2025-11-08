import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Photo from '@/lib/models/Photo';
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

    const photos = await Photo.find({ couple: coupleId }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(photos);
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
      title,
      description,
      imageUrl,
      thumbnailUrl,
      category,
      featured,
      order,
      coupleId: bodyCoupleId
    } = await request.json();

    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const photo = new Photo({
      couple: coupleId,
      title,
      description,
      imageUrl,
      thumbnailUrl: thumbnailUrl || imageUrl,
      category: category || 'other',
      uploadedBy: 'admin',
      featured: featured || false,
      order: order || 0
    });

    await photo.save();
    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
