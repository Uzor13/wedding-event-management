import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
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

    const { tagId, userIds = [], coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        ...(coupleId ? { coupleId } : {})
      }
    });

    if (!tag) {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      );
    }

    const guests = await prisma.guest.findMany({
      where: {
        id: { in: userIds },
        coupleId: tag.coupleId
      }
    });

    if (guests.length !== userIds.length) {
      return NextResponse.json(
        { message: 'Some users not found for this couple' },
        { status: 400 }
      );
    }

    // Get existing guest IDs to avoid duplicates
    const existingTag = await prisma.tag.findUnique({
      where: { id: tag.id },
      include: { guests: { select: { id: true } } }
    });

    const existingGuestIds = existingTag?.guests.map(g => g.id) || [];
    const newGuestIds = userIds.filter((id: string) => !existingGuestIds.includes(id));

    const updated = await prisma.tag.update({
      where: { id: tag.id },
      data: {
        guests: {
          connect: newGuestIds.map((id: string) => ({ id }))
        }
      },
      include: {
        guests: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
