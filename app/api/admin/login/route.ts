import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { message: 'Admin credentials are not configured' },
        { status: 500 }
      );
    }

    const { username, password } = await request.json();

    if (username === adminUsername && password === adminPassword) {
      const token = generateToken({ userId: 'admin', role: 'admin' });
      return NextResponse.json({ token, role: 'admin' });
    }

    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
