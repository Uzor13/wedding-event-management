import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface EventDetails {
  eventTitle: string;
  coupleNames: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  colorOfDay: string;
}

interface GuestInfo {
  name: string;
  phoneNumber: string;
  uniqueId: string;
  code: string;
}

interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export async function generateInvitationPDF(
  guestInfo: GuestInfo,
  eventDetails: EventDetails,
  theme: ThemeColors,
  rsvpLink: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Generate QR code as base64
  const qrCodeDataUrl = await QRCode.toDataURL(rsvpLink, {
    width: 300,
    margin: 1,
    color: {
      dark: theme.primaryColor,
      light: '#FFFFFF'
    }
  });

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 111, g: 78, b: 55 }; // Default coffee color
  };

  const primaryRgb = hexToRgb(theme.primaryColor);
  const secondaryRgb = hexToRgb(theme.secondaryColor);
  const accentRgb = hexToRgb(theme.accentColor);

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const margin = 20;

  let yPos = 30;

  // Title - "You're Invited"
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text("You're Invited", centerX, yPos, { align: 'center' });
  yPos += 12;

  // Simple divider line
  doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setLineWidth(0.5);
  doc.line(centerX - 30, yPos, centerX + 30, yPos);
  yPos += 15;

  // Guest name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Dear ${guestInfo.name},`, centerX, yPos, { align: 'center' });
  yPos += 10;

  // Invitation text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('You are cordially invited to celebrate the wedding of', centerX, yPos, { align: 'center' });
  yPos += 15;

  // Couple names
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text(eventDetails.coupleNames, centerX, yPos, { align: 'center' });
  yPos += 15;

  // Event title
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.text(eventDetails.eventTitle, centerX, yPos, { align: 'center' });
  yPos += 18;

  // Event details section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Event Details', centerX, yPos, { align: 'center' });
  yPos += 10;

  // Details with consistent spacing
  const detailsLeftMargin = 40;
  const detailsRightMargin = pageWidth - 40;
  const detailsWidth = detailsRightMargin - detailsLeftMargin;

  // Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Date:', detailsLeftMargin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(eventDetails.eventDate, detailsLeftMargin + 15, yPos);
  yPos += 8;

  // Time
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Time:', detailsLeftMargin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(eventDetails.eventTime, detailsLeftMargin + 15, yPos);
  yPos += 8;

  // Venue
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Venue:', detailsLeftMargin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(eventDetails.venueName, detailsLeftMargin + 15, yPos);
  yPos += 8;

  // Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Address:', detailsLeftMargin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const addressLines = doc.splitTextToSize(eventDetails.venueAddress, detailsWidth - 20);
  doc.text(addressLines, detailsLeftMargin + 20, yPos);
  yPos += (addressLines.length * 5) + 3;

  // Attire
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Attire:', detailsLeftMargin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(eventDetails.colorOfDay, detailsLeftMargin + 15, yPos);
  yPos += 18;

  // Divider before RSVP section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(centerX - 40, yPos, centerX + 40, yPos);
  yPos += 15;

  // RSVP section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Please Confirm Your Attendance', centerX, yPos, { align: 'center' });
  yPos += 10;

  // QR code
  const qrSize = 40;
  const qrX = (pageWidth - qrSize) / 2;

  // Add QR code
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
  yPos += qrSize + 8;

  // Instruction text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Scan the QR code to confirm your attendance', centerX, yPos, { align: 'center' });
  yPos += 10;

  // Verification code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Verification Code:', centerX, yPos, { align: 'center' });
  yPos += 6;

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(guestInfo.code, centerX, yPos, { align: 'center' });
  yPos += 10;

  // RSVP link
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  const rsvpText = doc.splitTextToSize(rsvpLink, pageWidth - 50);
  doc.text(rsvpText, centerX, yPos, { align: 'center' });

  // Footer
  const footerY = pageHeight - 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('We look forward to celebrating with you!', centerX, footerY, { align: 'center' });

  // Return as blob
  return doc.output('blob');
}

export function downloadInvitationPDF(
  blob: Blob,
  guestName: string
) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Wedding-Invitation-${guestName.replace(/\s+/g, '-')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generateBulkInvitations(
  guests: GuestInfo[],
  eventDetails: EventDetails,
  theme: ThemeColors,
  baseUrl: string
): Promise<Blob[]> {
  const pdfs: Blob[] = [];

  for (const guest of guests) {
    const rsvpLink = `${baseUrl}/rsvp/${guest.uniqueId}`;
    const pdf = await generateInvitationPDF(guest, eventDetails, theme, rsvpLink);
    pdfs.push(pdf);
  }

  return pdfs;
}
