import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Update all guests - since plusOneAllowed is now a required boolean field in Prisma,
    // we don't need to check for null. This route can be used to reset all values if needed.
    const result = await prisma.guest.updateMany({
      where: {
        plusOneAllowed: { not: true } // Update all that are not explicitly true
      },
      data: {
        plusOneAllowed: false
      }
    });

    // Get counts
    const totalGuests = await prisma.guest.count();
    const withPlusOne = await prisma.guest.count({ where: { plusOneAllowed: true } });
    const withoutPlusOne = await prisma.guest.count({ where: { plusOneAllowed: false } });

    return NextResponse.json({
      message: 'Fixed plusOneAllowed field',
      updated: result.count,
      stats: {
        total: totalGuests,
        withPlusOne,
        withoutPlusOne
      }
    });
  } catch (error: any) {
    console.error('Fix plusOne error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
