import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Tag from '@/lib/models/Tag';
import Guest from '@/lib/models/Guest';
import { verifyAuth } from '@/lib/auth';

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

    const { tagId, userIds = [], coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    const tag = await Tag.findOne({
      _id: tagId,
      ...(coupleId ? { couple: coupleId } : {})
    });

    if (!tag) {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }

    const guests = await Guest.find({ _id: { $in: userIds }, couple: tag.couple });

    if (guests.length !== userIds.length) {
      return NextResponse.json(
        { message: 'Some users not found for this couple' },
        { status: 400 }
      );
    }

    const updated = await Tag.findByIdAndUpdate(
      tag._id,
      { $addToSet: { users: { $each: userIds } } },
      { new: true }
    ).populate('users', 'name phoneNumber');

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
