import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Guest from '@/lib/models/Guest';
import Setting from '@/lib/models/Setting';
import { verifyAuth } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/services/email';

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

    const { guestId, email, coupleId: bodyCoupleId } = await request.json();

    if (!guestId || !email) {
      return NextResponse.json(
        { message: 'Guest ID and email are required' },
        { status: 400 }
      );
    }

    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json(
        { message: 'Couple ID is required' },
        { status: 400 }
      );
    }

    // Get guest
    const guest = await Guest.findOne({
      _id: guestId,
      couple: coupleId
    });

    if (!guest) {
      return NextResponse.json(
        { message: 'Guest not found' },
        { status: 404 }
      );
    }

    // Get event settings
    const settings = await Setting.findOne({ couple: coupleId });

    if (!settings) {
      return NextResponse.json(
        { message: 'Event settings not found. Please configure event settings first.' },
        { status: 404 }
      );
    }

    // Generate RSVP link
    const rsvpLink = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guest.uniqueId}`;

    // Send email
    await sendInvitationEmail(
      email,
      guest.name,
      rsvpLink,
      {
        coupleNames: settings.coupleNames,
        eventTitle: settings.eventTitle,
        eventDate: settings.eventDate,
        eventTime: settings.eventTime,
        venueName: settings.venueName,
        venueAddress: settings.venueAddress
      }
    );

    return NextResponse.json({
      message: 'Email sent successfully',
      recipient: email
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Bulk email sending
export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { guestIds, coupleId: bodyCoupleId } = await request.json();

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return NextResponse.json(
        { message: 'Guest IDs array is required' },
        { status: 400 }
      );
    }

    const coupleId = auth.role === 'couple'
      ? auth.coupleId
      : bodyCoupleId;

    if (!coupleId) {
      return NextResponse.json(
        { message: 'Couple ID is required' },
        { status: 400 }
      );
    }

    // Get event settings
    const settings = await Setting.findOne({ couple: coupleId });

    if (!settings) {
      return NextResponse.json(
        { message: 'Event settings not found. Please configure event settings first.' },
        { status: 404 }
      );
    }

    // Get guests (only those with phone numbers that look like emails or have @ symbol)
    const guests = await Guest.find({
      _id: { $in: guestIds },
      couple: coupleId
    });

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const guest of guests) {
      try {
        // Try to extract email from phoneNumber field if it contains @
        // Otherwise skip this guest
        if (!guest.phoneNumber.includes('@')) {
          results.failed++;
          results.errors.push(`${guest.name}: No email address found`);
          continue;
        }

        const rsvpLink = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guest.uniqueId}`;

        await sendInvitationEmail(
          guest.phoneNumber, // Using phoneNumber as email
          guest.name,
          rsvpLink,
          {
            coupleNames: settings.coupleNames,
            eventTitle: settings.eventTitle,
            eventDate: settings.eventDate,
            eventTime: settings.eventTime,
            venueName: settings.venueName,
            venueAddress: settings.venueAddress
          }
        );

        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${guest.name}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Emails sent: ${results.sent}, Failed: ${results.failed}`,
      results
    });
  } catch (error: any) {
    console.error('Bulk email send error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}
