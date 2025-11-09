import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
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

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    const where = coupleId ? { coupleId } : {};
    const guests = await prisma.guest.findMany({
      where,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        rsvpStatus: true,
        uniqueId: true,
        code: true,
        isUsed: true,
        plusOneAllowed: true,
        plusOneName: true,
        plusOnePhone: true,
        plusOneRsvp: true,
        mealPreference: true,
        plusOneMealPreference: true,
        dietaryRestrictions: true,
        plusOneDietaryRestrictions: true,
        tableName: true,
        tableNumber: true,
        seatingAssigned: true,
        coupleId: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Log first guest to check plusOneAllowed
    if (guests.length > 0) {
      console.log('First guest plusOneAllowed:', guests[0].plusOneAllowed, 'Name:', guests[0].name);
    }

    return NextResponse.json(guests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
