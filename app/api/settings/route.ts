import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

async function ensureSettings(coupleId: string | null = null) {
  if (!coupleId) {
    return null;
  }

  // Reject invalid UUIDs (e.g., couple names from old MongoDB sessions)
  if (!isValidUUID(coupleId)) {
    return null;
  }

  let settings = await prisma.setting.findUnique({
    where: { coupleId }
  });

  if (!settings) {
    // Get couple info to pre-fill settings
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { name: true, weddingDate: true }
    });

    settings = await prisma.setting.create({
      data: {
        coupleId,
        coupleNames: couple?.name || "The Happy Couple",
        eventDate: couple?.weddingDate ? new Date(couple.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined
      }
    });
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

    const { searchParams } = new URL(request.url);
    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : (searchParams.get('coupleId') || null);

    const settings = await ensureSettings(coupleId);

    // Assemble theme object from flat fields for frontend compatibility
    if (settings) {
      const response = {
        ...settings,
        theme: {
          primaryColor: settings.primaryColor || '#6F4E37',
          secondaryColor: settings.secondaryColor || '#8B7355',
          accentColor: settings.accentColor || '#F5E9D3',
          backgroundColor: settings.backgroundColor || '#FFFFFF',
          textColor: settings.textColor || '#000000',
          qrBackgroundColor: settings.qrBackgroundColor || '#FFFFFF'
        }
      };
      return NextResponse.json(response);
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[Settings GET Error]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    const isAuthError = ['No token provided', 'Invalid token', 'jwt malformed'].includes(error?.message);
    const status = isAuthError ? 401 : 500;
    const message = isAuthError ? 'Authentication required' : 'Unable to load settings. Please try again later.';

    return NextResponse.json({ message }, { status });
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

    const body = await request.json();

    const allowedFields = ['eventTitle', 'coupleNames', 'eventDate', 'eventTime', 'venueName', 'venueAddress', 'colorOfDay'];
    const themeFields = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor', 'qrBackgroundColor'];
    const featureFlags = ['enableTimeline', 'enableMessages', 'enableEvents', 'enableRegistry', 'enablePhotos', 'enableBudget', 'enableSeating'];

    const update: any = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    });

    if (body.theme && typeof body.theme === 'object') {
      themeFields.forEach((field) => {
        if (body.theme[field] !== undefined) {
          update[field] = body.theme[field];
        }
      });
    }

    // Only admin can update feature flags
    if (auth.role === 'admin') {
      featureFlags.forEach((field) => {
        if (body[field] !== undefined) {
          update[field] = Boolean(body[field]);
        }
      });
    }

    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : (body.coupleId || null);

    if (!coupleId) {
      return NextResponse.json(
        { message: 'coupleId is required' },
        { status: 400 }
      );
    }

    // Reject invalid UUIDs
    if (!isValidUUID(coupleId)) {
      return NextResponse.json(
        { message: 'Invalid coupleId format' },
        { status: 400 }
      );
    }

    const settings = await prisma.setting.upsert({
      where: { coupleId },
      update,
      create: {
        coupleId,
        ...update
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[Settings POST Error]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    const isAuthError = ['No token provided', 'Invalid token', 'jwt malformed'].includes(error?.message);
    const status = isAuthError ? 401 : 500;
    const message = isAuthError ? 'Authentication required' : 'Unable to save settings. Please try again later.';

    return NextResponse.json({ message }, { status });
  }
}
