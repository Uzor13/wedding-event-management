import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    const guests = await prisma.guest.findMany({
      where: { coupleId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        tableName: true,
        tableNumber: true,
        seatingAssigned: true,
        plusOneAllowed: true,
        plusOneName: true,
        rsvpStatus: true
      },
      orderBy: [
        { tableNumber: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(guests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
