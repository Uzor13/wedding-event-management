import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

// Email functionality disabled
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: 'Email functionality is currently disabled' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Bulk email sending disabled
export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: 'Bulk email functionality is currently disabled' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}
