import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Tag from '@/lib/models/Tag';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    const filter = coupleId ? { couple: coupleId } : {};
    const tags = await Tag.find(filter).populate('users', 'name phoneNumber').sort({ createdAt: -1 });

    // Ensure all tags have a color field (for backwards compatibility with old tags)
    const tagsWithColor = tags.map(tag => {
      const tagObj = tag.toObject();
      if (!tagObj.color) {
        tagObj.color = '#3b82f6';
      }
      return tagObj;
    });

    return NextResponse.json(tagsWithColor);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { name, color, coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!name || !coupleId) {
      return NextResponse.json(
        { message: 'Name and coupleId are required' },
        { status: 400 }
      );
    }

    const existingTag = await Tag.findOne({ name, couple: coupleId });
    if (existingTag) {
      return NextResponse.json(
        { message: 'Tag already exists' },
        { status: 400 }
      );
    }

    const tag = await Tag.create({ name, color: color || '#3b82f6', couple: coupleId });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
