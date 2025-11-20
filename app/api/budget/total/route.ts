import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { totalBudget, coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json({ message: 'Couple ID required' }, { status: 400 });
    }

    if (typeof totalBudget !== 'number' || totalBudget < 0) {
      return NextResponse.json({ message: 'Invalid budget amount' }, { status: 400 });
    }

    // Upsert the totalBudget in settings
    const settings = await prisma.setting.upsert({
      where: { coupleId },
      update: { totalBudget },
      create: {
        coupleId,
        totalBudget
      }
    });

    return NextResponse.json({ totalBudget: settings.totalBudget });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
