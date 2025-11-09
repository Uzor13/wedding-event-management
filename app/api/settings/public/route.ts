import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

async function ensureSettings(coupleId: string | null = null) {
  if (!coupleId) {
    return null;
  }

  // Reject invalid UUIDs
  if (!isValidUUID(coupleId)) {
    return null;
  }

  let settings = await prisma.setting.findUnique({
    where: { coupleId }
  });

  if (!settings) {
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
    const { searchParams } = new URL(request.url);
    const coupleId = searchParams.get('coupleId') || null;

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
    console.error('[Public Settings GET Error]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return user-friendly error message
    return NextResponse.json(
      { message: 'Unable to load event settings. Please try again later.' },
      { status: 500 }
    );
  }
}
