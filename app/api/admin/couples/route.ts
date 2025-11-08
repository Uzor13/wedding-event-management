import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import Couple from '@/lib/models/Couple';
import Setting from '@/lib/models/Setting';
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

    await dbConnect();
    const couples = await Couple.find().select('-password').sort({ createdAt: -1 });

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

    await dbConnect();

    const { name, email } = await request.json();
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    const { username, password } = generateCredentials(name);
    const hash = await bcrypt.hash(password, 10);

    const couple = await Couple.create({
      name,
      email,
      username,
      password: hash
    });

    await Setting.findOneAndUpdate(
      { couple: couple._id },
      { $setOnInsert: { couple: couple._id } },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      couple: {
        _id: couple._id.toString(),
        name: couple.name,
        email: couple.email,
        username: couple.username,
        createdAt: couple.createdAt
      },
      credentials: { username, password }
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
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
