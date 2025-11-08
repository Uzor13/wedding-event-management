import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import { verifyAuth } from '@/lib/auth';
import { generateUniqueId, generateCode } from '@/lib/utils/idUtils';

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

    const existingGuest = await Guest.findOne({ phoneNumber, couple: coupleId });
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

    const existingCodeForUser = await Guest.findOne({ code });
    if (existingCodeForUser) {
      code = generateCode();
    }

    const guest = new Guest({
      name,
      phoneNumber,
      uniqueId,
      qrCode: qrcode,
      code,
      couple: coupleId,
      plusOneAllowed: plusOneAllowed || false,
      plusOneName: plusOneName || undefined,
      mealPreference: mealPreference || undefined,
      dietaryRestrictions: dietaryRestrictions || undefined
    });

    await guest.save();

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
