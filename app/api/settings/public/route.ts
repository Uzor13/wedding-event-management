import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Setting from '@/lib/models/Setting';

async function ensureSettings(coupleId: string | null = null) {
  const filter = coupleId ? { couple: coupleId } : { couple: null };
  let settings = await Setting.findOne(filter);
  if (!settings) {
    settings = await Setting.create(filter);
  }
  return settings;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const coupleId = searchParams.get('coupleId') || null;

    const settings = await ensureSettings(coupleId);

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
