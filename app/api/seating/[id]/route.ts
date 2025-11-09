import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { tableName, tableNumber, seatingAssigned } = await request.json();

    const updateData: any = {};

    if (tableName !== undefined) {
      updateData.tableName = tableName || null;
    }

    if (tableNumber !== undefined) {
      if (tableNumber === '' || tableNumber === null) {
        updateData.tableNumber = null;
      } else {
        const parsed = parseInt(tableNumber);
        updateData.tableNumber = isNaN(parsed) ? null : parsed;
      }
    }

    if (seatingAssigned !== undefined) {
      updateData.seatingAssigned = Boolean(seatingAssigned);
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(guest);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
