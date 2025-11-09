import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { userId, newTagId, coupleId: bodyCoupleId } = await request.json();

    if (!userId || !newTagId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;
    const newTag = await prisma.tag.findFirst({
      where: {
        id: newTagId,
        ...(coupleId ? { coupleId } : {})
      }
    });

    if (!newTag) {
      return NextResponse.json(
        { message: 'New tag not found' },
        { status: 404 }
      );
    }

    const currentTag = await prisma.tag.findFirst({
      where: {
        coupleId: newTag.coupleId,
        guests: {
          some: {
            id: userId
          }
        }
      }
    });

    if (currentTag && currentTag.id === newTag.id) {
      return NextResponse.json({ message: 'User already assigned to this tag' });
    }

    // Prisma handles transactions internally with multiple operations
    try {
      await prisma.$transaction(async (tx) => {
        // Remove user from current tag if exists
        if (currentTag) {
          await tx.tag.update({
            where: { id: currentTag.id },
            data: {
              guests: {
                disconnect: { id: userId }
              }
            }
          });
        }

        // Add user to new tag
        await tx.tag.update({
          where: { id: newTag.id },
          data: {
            guests: {
              connect: { id: userId }
            }
          }
        });
      });

      return NextResponse.json({ message: 'User reassigned successfully' });
    } catch (error: any) {
      console.error('Error reassigning user to tag:', error);
      return NextResponse.json(
        { message: 'Failed to reassign user. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in reassign tag route:', error);
    return NextResponse.json(
      { message: 'An error occurred while reassigning the user.' },
      { status: 500 }
    );
  }
}
