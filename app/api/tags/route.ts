import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

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
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : searchParams.get('coupleId');

    // Validate coupleId if provided
    if (coupleId && !isValidUUID(coupleId)) {
      return NextResponse.json(
        { message: 'Invalid coupleId format' },
        { status: 400 }
      );
    }

    const where = coupleId ? { coupleId } : {};
    const tags = await prisma.tag.findMany({
      where,
      include: {
        guests: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map to match old format (users -> guests)
    const tagsWithUsers = tags.map(tag => ({
      ...tag,
      users: tag.guests,
      color: tag.color || '#3b82f6'
    }));

    return NextResponse.json(tagsWithUsers);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { name, color, coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!name || !coupleId) {
      return NextResponse.json(
        { message: 'Name and coupleId are required' },
        { status: 400 }
      );
    }

    const existingTag = await prisma.tag.findUnique({
      where: {
        name_coupleId: {
          name,
          coupleId
        }
      }
    });

    if (existingTag) {
      return NextResponse.json(
        { message: 'Tag already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || '#3b82f6',
        coupleId
      }
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
