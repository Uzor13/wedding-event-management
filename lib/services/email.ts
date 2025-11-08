import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendInvitationEmail(
  to: string,
  guestName: string,
  rsvpLink: string,
  eventDetails: {
    coupleNames: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    venueName: string;
    venueAddress: string;
  }
) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `You're Invited: ${eventDetails.eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 32px; font-family: 'Great Vibes', cursive; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .details { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details p { margin: 10px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${eventDetails.eventTitle}</h1>
              <p style="margin: 10px 0 0; font-size: 18px;">${eventDetails.coupleNames}</p>
            </div>
            <div class="content">
              <h2>Dear ${guestName},</h2>
              <p>You are warmly invited to celebrate with us!</p>

              <div class="details">
                <p><strong>📅 Date:</strong> ${eventDetails.eventDate}</p>
                <p><strong>🕐 Time:</strong> ${eventDetails.eventTime}</p>
                <p><strong>📍 Venue:</strong> ${eventDetails.venueName}</p>
                <p><strong>🗺️ Address:</strong> ${eventDetails.venueAddress}</p>
              </div>

              <p>Please confirm your attendance by clicking the button below:</p>

              <center>
                <a href="${rsvpLink}" class="button">Confirm RSVP</a>
              </center>

              <p>We look forward to celebrating this special day with you!</p>
            </div>
            <div class="footer">
              <p>This invitation was sent via Wedding RSVP Management System</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}
