import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Photo from '@/lib/models/Photo';
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

    const { title, description, imageUrl, thumbnailUrl, category, featured, order } =
      await request.json();

    const photo = await Photo.findByIdAndUpdate(
      id,
      { title, description, imageUrl, thumbnailUrl, category, featured, order },
      { new: true }
    );

    if (!photo) {
      return NextResponse.json({ message: 'Photo not found' }, { status: 404 });
    }

    return NextResponse.json(photo);
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

    const photo = await Photo.findByIdAndDelete(id);

    if (!photo) {
      return NextResponse.json({ message: 'Photo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
