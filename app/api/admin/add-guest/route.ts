import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth';
import { generateUniqueId, generateCode } from '@/lib/utils/idUtils';

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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

    const {
      name,
      phoneNumber,
      coupleId: bodyCoupleId,
      plusOneAllowed,
      plusOneName,
      mealPreference,
      dietaryRestrictions
    } = await request.json();

    console.log('Received plusOneAllowed:', plusOneAllowed, 'Type:', typeof plusOneAllowed);

    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json(
        { message: 'coupleId is required' },
        { status: 400 }
      );
    }

    // Reject invalid UUIDs (e.g., couple names from old MongoDB sessions)
    if (!isValidUUID(coupleId)) {
      return NextResponse.json(
        { message: 'Invalid coupleId format' },
        { status: 400 }
      );
    }

    const existingGuest = await prisma.guest.findFirst({
      where: {
        phoneNumber,
        coupleId
      }
    });

    if (existingGuest) {
      return NextResponse.json(
        { message: 'Guest with this phone number already exists' },
        { status: 400 }
      );
    }

    const uniqueId = generateUniqueId();
    const uniqueLink = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${uniqueId}`;
    const qrcode = await QRCode.toDataURL(uniqueLink);
    let code = generateCode();

    const existingCodeForUser = await prisma.guest.findFirst({
      where: { code }
    });

    if (existingCodeForUser) {
      code = generateCode();
    }

    const guest = await prisma.guest.create({
      data: {
        name,
        phoneNumber,
        uniqueId,
        qrCode: qrcode,
        code,
        coupleId,
        plusOneAllowed: plusOneAllowed || false,
        plusOneName: plusOneName || undefined,
        mealPreference: mealPreference || undefined,
        dietaryRestrictions: dietaryRestrictions || undefined
      }
    });

    console.log('Saved guest plusOneAllowed:', guest.plusOneAllowed);

    return NextResponse.json(
      { guest, uniqueLink, code },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
