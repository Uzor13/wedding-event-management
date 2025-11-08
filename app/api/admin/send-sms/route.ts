import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Setting from '@/lib/models/Setting';
import { verifyAuth } from '@/lib/auth';
import { sendSMS } from '@/lib/services/sms';

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

    const { name, phoneNumber, link, coupleId: bodyCoupleId } = await request.json();
    const coupleId = auth.role === 'couple' ? auth.coupleId : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json(
        { message: 'coupleId is required' },
        { status: 400 }
      );
    }

    const settings = coupleId ? await Setting.findOne({ couple: coupleId }) : null;

    const coupleNames = settings?.coupleNames || 'Chris and Amaka';
    const eventTitle = settings?.eventTitle || 'Wedding Celebration';
    const eventDate = settings?.eventDate || 'the wedding day';
    const eventTime = settings?.eventTime || 'the scheduled time';
    const venue = settings?.venueName || 'our celebration venue';
    const venueAddress = settings?.venueAddress || '';
    const colorOfDay = settings?.colorOfDay ? ` Colour of the day: ${settings.colorOfDay}.` : '';
    const addressPart = venueAddress ? ` (${venueAddress})` : '';

    const message = `Dear ${name}, you are warmly invited to ${coupleNames}'s ${eventTitle} at ${venue}${addressPart} on ${eventDate} at ${eventTime}.${colorOfDay} Confirm your RSVP here: ${link}`;

    await sendSMS(phoneNumber, message);

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully'
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
