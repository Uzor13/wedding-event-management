import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Setting from '@/lib/models/Setting';
import { verifyAuth } from '@/lib/auth';

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
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : (searchParams.get('coupleId') || null);

    const settings = await ensureSettings(coupleId);

    return NextResponse.json(settings);
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

    await dbConnect();

    const body = await request.json();

    const allowedFields = ['eventTitle', 'coupleNames', 'eventDate', 'eventTime', 'venueName', 'venueAddress', 'colorOfDay'];
    const themeFields = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor', 'qrBackgroundColor', 'qrTextColor', 'buttonColor', 'buttonTextColor'];

    const update: any = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    });

    if (body.theme && typeof body.theme === 'object') {
      themeFields.forEach((field) => {
        if (body.theme[field] !== undefined) {
          update[`theme.${field}`] = body.theme[field];
        }
      });
    }

    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : (body.coupleId || null);

    const settings = await Setting.findOneAndUpdate(
      coupleId ? { couple: coupleId } : { couple: null },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
