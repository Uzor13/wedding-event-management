import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import Tag from '@/lib/models/Tag';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const { tagIds } = await request.json();

    if (!Array.isArray(tagIds)) {
      return NextResponse.json(
        { message: 'tagIds must be an array' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    // Build filter
    const filter: any = { _id: id };
    if (coupleId) {
      filter.couple = coupleId;
    }

    // Find the guest
    const guest = await Guest.findOne(filter);
    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    // Get current tags
    const currentTagIds = guest.tags.map((t: any) => t.toString());

    // Find tags to remove (in current but not in new)
    const tagsToRemove = currentTagIds.filter((tagId: string) => !tagIds.includes(tagId));

    // Find tags to add (in new but not in current)
    const tagsToAdd = tagIds.filter((tagId: string) => !currentTagIds.includes(tagId));

    // Remove guest from tags
    if (tagsToRemove.length > 0) {
      await Tag.updateMany(
        { _id: { $in: tagsToRemove } },
        { $pull: { users: id } }
      );
    }

    // Add guest to tags
    if (tagsToAdd.length > 0) {
      await Tag.updateMany(
        { _id: { $in: tagsToAdd } },
        { $addToSet: { users: id } }
      );
    }

    // Update guest's tags
    guest.tags = tagIds;
    await guest.save();

    // Return updated guest with populated tags
    const updatedGuest = await Guest.findById(id).populate('tags', 'name color');

    return NextResponse.json(updatedGuest);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
