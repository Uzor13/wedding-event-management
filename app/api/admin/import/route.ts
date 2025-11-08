import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
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

    const { csvData, coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json(
        { message: 'coupleId is required' },
        { status: 400 }
      );
    }

    let records;
    try {
      records = parse(csvData, { columns: true, trim: true });
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid CSV format' },
        { status: 400 }
      );
    }

    const importedGuests = [];

    for (const record of records) {
      const uniqueId = generateUniqueId();
      const code = generateCode();
      const uniqueLink = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${uniqueId}`;
      const qrcode = await QRCode.toDataURL(uniqueLink);

      const guest = new Guest({
        name: record.name,
        phoneNumber: record.phoneNumber,
        uniqueId,
        code,
        qrCode: qrcode,
        couple: coupleId
      });

      await guest.save();
      importedGuests.push(guest);
    }

    return NextResponse.json(importedGuests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
