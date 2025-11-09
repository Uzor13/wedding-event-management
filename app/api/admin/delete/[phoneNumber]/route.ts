import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { phoneNumber } = await params;
    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple' ? auth.coupleId : searchParams.get('coupleId');

    if (auth.role === 'admin' && !coupleId) {
      return NextResponse.json(
        { message: 'coupleId is required' },
        { status: 400 }
      );
    }

    const filter: any = { phoneNumber };
    if (coupleId) {
      filter.coupleId = coupleId;
    }

    const guest = await prisma.guest.findFirst({
      where: filter
    });

    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    await prisma.guest.delete({
      where: { id: guest.id }
    });

    return NextResponse.json({
      code: 200,
      message: 'Guest deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Error deleting guest', error: error.message },
      { status: 500 }
    );
  }
}
