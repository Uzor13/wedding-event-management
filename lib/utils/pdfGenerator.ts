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

  // Background accent
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');

  // Decorative borders
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(0.5);
  doc.rect(10, 45, pageWidth - 20, pageHeight - 90, 'S');

  // Title - "You're Invited"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text("You're Invited", pageWidth / 2, 30, { align: 'center' });

  // Decorative line
  doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setLineWidth(0.3);
  doc.line(40, 35, pageWidth - 40, 35);

  let yPos = 60;

  // Guest name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(`Dear ${guestInfo.name},`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Invitation text
  doc.setFontSize(12);
  const invitationText = 'You are warmly invited to celebrate with us!';
  doc.text(invitationText, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Event title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text(eventDetails.eventTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Couple names
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(18);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.text(eventDetails.coupleNames, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Calculate box height dynamically based on content
  const addressLines = doc.splitTextToSize(eventDetails.venueAddress, pageWidth - 70);
  const boxHeight = 45 + (addressLines.length - 1) * 5;

  // Event details box
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.roundedRect(20, yPos - 5, pageWidth - 40, boxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);

  yPos += 5;

  // Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Date:', 28, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(eventDetails.eventDate, 55, yPos);
  yPos += 8;

  // Time
  doc.setFont('helvetica', 'bold');
  doc.text('Time:', 28, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(eventDetails.eventTime, 55, yPos);
  yPos += 8;

  // Venue
  doc.setFont('helvetica', 'bold');
  doc.text('Venue:', 28, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(eventDetails.venueName, 55, yPos);
  yPos += 8;

  // Address (split if too long)
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', 28, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(addressLines, 55, yPos);
  yPos += addressLines.length * 5 + 8;

  // Color of the day
  doc.setFont('helvetica', 'bold');
  doc.text('Dress Code:', 28, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(eventDetails.colorOfDay, 55, yPos);
  yPos += 15;

  // QR Code section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Scan to RSVP', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  // Add QR code
  const qrSize = 50;
  doc.addImage(qrCodeDataUrl, 'PNG', (pageWidth - qrSize) / 2, yPos, qrSize, qrSize);
  yPos += qrSize + 8;

  // Verification code
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Verification Code: ${guestInfo.code}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  // RSVP link
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const rsvpText = doc.splitTextToSize(rsvpLink, pageWidth - 40);
  doc.text(rsvpText, pageWidth / 2, yPos, { align: 'center' });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('We look forward to celebrating with you!', pageWidth / 2, pageHeight - 25, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Generated by Wedding RSVP Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });

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
