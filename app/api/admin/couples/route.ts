import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

function generateCredentials(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const suffix = crypto.randomBytes(2).toString('hex');
  const username = `${base || 'couple'}${suffix}`;
  const password = crypto.randomBytes(4).toString('hex');
  return { username, password };
}

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const couples = await prisma.couple.findMany({
      select: {
        id: true,
        name: true,
        weddingDate: true,
        email: true,
        username: true,
        eventTitle: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(couples);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { name, email, weddingDate } = await request.json();
    if (!name) {
      return NextResponse.json(
        { message: 'Couple name is required' },
        { status: 400 }
      );
    }

    const { username, password } = generateCredentials(name);
    const hash = await bcrypt.hash(password, 10);

    const couple = await prisma.couple.create({
      data: {
        name,
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        email: email || undefined,
        username,
        password: hash
      }
    });

    // Create default settings for this couple
    await prisma.setting.create({
      data: {
        coupleId: couple.id
      }
    });

    return NextResponse.json({
      couple: {
        id: couple.id,
        name: couple.name,
        email: couple.email,
        username: couple.username,
        createdAt: couple.createdAt
      },
      credentials: { username, password }
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Couple already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
