import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

// SMS functionality disabled
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
      { message: 'SMS functionality is currently disabled' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

// Bulk SMS sending disabled
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
      { message: 'Bulk SMS functionality is currently disabled' },
      { status: 501 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to send SMS messages' },
      { status: 500 }
    );
  }
}
