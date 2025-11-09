import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const photos = await prisma.photo.findMany({
      where: { coupleId },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
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

    const photo = await prisma.photo.create({
      data: {
        coupleId,
        title,
        description,
        imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl,
        category: category || 'other',
        uploadedBy: 'admin',
        featured: featured || false,
        order: order || 0
      }
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint violation' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
