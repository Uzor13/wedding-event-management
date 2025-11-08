import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Tag, { ITag } from '@/lib/models/Tag';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { userId, newTagId, coupleId: bodyCoupleId } = await request.json();

    if (!userId || !newTagId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;
    const newTag = await Tag.findOne({
      _id: newTagId,
      ...(coupleId ? { couple: coupleId } : {})
    }) as ITag | null;

    if (!newTag) {
      return NextResponse.json(
        { message: 'New tag not found' },
        { status: 404 }
      );
    }

    const currentTag = await Tag.findOne({ users: userId, couple: newTag.couple }) as ITag | null;

    if (currentTag && currentTag._id.equals(newTag._id)) {
      return NextResponse.json({ message: 'User already assigned to this tag' });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (currentTag) {
          await Tag.findByIdAndUpdate(
            currentTag._id,
            { $pull: { users: userId } },
            { session }
          );
        }

        await Tag.findByIdAndUpdate(
          newTag._id,
          { $addToSet: { users: userId } },
          { session }
        );
      });
      await session.endSession();

      return NextResponse.json({ message: 'User reassigned successfully' });
    } catch (error: any) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
