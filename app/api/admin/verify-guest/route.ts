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

    const { uniqueId, code, coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    const where: any = {
      OR: [
        { uniqueId: uniqueId || '' },
        { code: code || '' }
      ]
    };

    if (coupleId) {
      where.coupleId = coupleId;
    }

    const guest = await prisma.guest.findFirst({
      where,
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (!guest) {
      return NextResponse.json(
        { success: false, message: 'Guest not found' },
        { status: 401 }
      );
    }

    // Track if already used BEFORE updating
    const wasAlreadyUsed = guest.isUsed;

    if (wasAlreadyUsed) {
      return NextResponse.json({
        success: true,
        message: 'This guest has already been verified',
        name: guest.name,
        phoneNumber: guest.phoneNumber,
        code: guest.code,
        uniqueId: guest.uniqueId,
        rsvpStatus: guest.rsvpStatus,
        isUsed: true,
        tags: guest.tags?.map((tag) => ({
          name: tag.name,
          color: tag.color
        })) || []
      });
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        isUsed: true,
        rsvpStatus: true
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      name: updatedGuest.name,
      phoneNumber: updatedGuest.phoneNumber,
      code: updatedGuest.code,
      uniqueId: updatedGuest.uniqueId,
      rsvpStatus: updatedGuest.rsvpStatus,
      isUsed: false, // Return false on first scan for proper UI feedback
      tags: updatedGuest.tags?.map((tag) => ({
        name: tag.name,
        color: tag.color
      })) || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
