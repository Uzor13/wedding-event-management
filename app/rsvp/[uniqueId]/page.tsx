'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Calendar, MapPin, Clock, Users, Download, CheckCircle, XCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface Guest {
  id: string;
  name: string;
  phoneNumber: string;
  uniqueId: string;
  code: string;
  rsvpStatus: boolean;
  plusOneAllowed: boolean;
  plusOneName?: string;
  plusOnePhone?: string;
  plusOneRsvp?: boolean;
  couple: {
    id: string;
    name: string;
    weddingDate: string;
  };
}

interface Event {
  id: string;
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  dressCode?: string;
  isMainEvent: boolean;
}

interface Settings {
  eventTitle: string;
  coupleNames: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  colorOfDay: string;
  enableMessages: boolean;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    qrBackgroundColor: string;
  };
}

export default function RSVPPage({ params }: { params: Promise<{ uniqueId: string }> }) {
  const resolvedParams = use(params);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [messageData, setMessageData] = useState({
    guestName: '',
    email: '',
    message: ''
  });
  const [formData, setFormData] = useState({
    rsvpStatus: false,
    plusOneName: '',
    plusOnePhone: '',
    plusOneRsvp: false
  });
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    fetchGuestData();
  }, [resolvedParams.uniqueId]);

  const fetchGuestData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/public/guest/${resolvedParams.uniqueId}`
      );
      const { guest: guestData, events: eventsData } = response.data;
      setGuest(guestData);
      setEvents(eventsData);

      // Generate QR code
      const rsvpLink = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guestData.uniqueId}`;
      const qrUrl = await QRCode.toDataURL(rsvpLink, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);

      // Fetch settings/theme
      try {
        const settingsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings/public?coupleId=${guestData.couple.id}`
        );
        setSettings(settingsResponse.data);
      } catch (err) {
        console.log('Could not load theme settings, using defaults');
      }

      setMessageData({
        guestName: guestData.name,
        email: '',
        message: ''
      });
      setFormData({
        rsvpStatus: guestData.rsvpStatus || false,
        plusOneName: guestData.plusOneName || '',
        plusOnePhone: guestData.plusOnePhone || '',
        plusOneRsvp: guestData.plusOneRsvp || false
      });

      // Check if guest has already responded
      // Only show confirmation if they explicitly accepted (rsvpStatus = true)
      // If rsvpStatus is false, show the form (could be new guest or declined guest who wants to update)
      setHasResponded(guestData.rsvpStatus === true);

      // Add small delay to ensure content is rendered before hiding loading
      setTimeout(() => setLoading(false), 100);
    } catch (error) {
      toast.error('Guest not found');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/public/guest/${resolvedParams.uniqueId}`,
        formData
      );
      toast.success('RSVP submitted successfully!');
      setHasResponded(true);
      await fetchGuestData();
    } catch (error) {
      toast.error('Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSubmitting(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/public/messages`,
        {
          coupleId: guest?.couple.id,
          guestName: messageData.guestName,
          email: messageData.email,
          message: messageData.message
        }
      );
      toast.success('Your message has been sent! It will be displayed after approval.');
      setMessageData({
        ...messageData,
        email: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setMessageSubmitting(false);
    }
  };

  const handleDownloadInvitation = async () => {
    if (!guest) {
      toast.error('Unable to download invitation');
      return;
    }

    setDownloading(true);
    toast.info('Preparing invitation...');

    try {
      // Option 1: Use browser's print dialog (more reliable)
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow pop-ups to download the invitation');
      }

      const element = document.getElementById('invitation-card');
      if (!element) {
        throw new Error('Invitation card not found');
      }

      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Create a complete HTML document for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${guest.name} - Wedding Invitation</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: white;
                padding: 20px;
              }
              @media print {
                body {
                  padding: 0;
                }
                @page {
                  margin: 0.5in;
                  size: auto;
                }
              }
              ${getInlineStyles()}
            </style>
          </head>
          <body>
            ${clonedElement.outerHTML}
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          toast.success('Print dialog opened! Save as PDF to download.');
          setDownloading(false);
        }, 250);
      };

      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (downloading) {
          printWindow.print();
          toast.success('Print dialog opened! Save as PDF to download.');
          setDownloading(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage);
      setDownloading(false);
    }
  };

  // Helper function to extract and inline styles
  const getInlineStyles = () => {
    const styles: string[] = [];

    // Get all stylesheets
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        if (sheet.cssRules) {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            styles.push(sheet.cssRules[j].cssText);
          }
        }
      } catch (e) {
        // Skip external stylesheets that can't be accessed
        console.log('Skipping external stylesheet');
      }
    }

    return styles.join('\n');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date TBD';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCoupleNames = () => {
    // Priority: settings.coupleNames > couple.name > fallback
    if (settings?.coupleNames) {
      return settings.coupleNames;
    }
    if (guest?.couple?.name) {
      return guest.couple.name;
    }
    return 'The Happy Couple';
  };

  const getEventTitle = () => {
    // Priority: settings.eventTitle > fallback
    if (settings?.eventTitle) {
      return settings.eventTitle;
    }
    return 'Wedding Invitation';
  };

  const getEventDate = () => {
    // Priority: settings.eventDate > couple.weddingDate > fallback
    if (settings?.eventDate) {
      return settings.eventDate;
    }
    if (guest?.couple?.weddingDate) {
      return formatDate(guest.couple.weddingDate);
    }
    return 'Date TBD';
  };

  const getVenueName = (mainEvent?: Event) => {
    // Priority: settings.venueName > mainEvent.venueName > fallback
    if (settings?.venueName) {
      return settings.venueName;
    }
    if (mainEvent?.venueName) {
      return mainEvent.venueName;
    }
    return 'Venue TBD';
  };

  const getVenueAddress = (mainEvent?: Event) => {
    // Priority: settings.venueAddress > mainEvent.venueAddress > fallback
    if (settings?.venueAddress) {
      return settings.venueAddress;
    }
    if (mainEvent?.venueAddress) {
      return mainEvent.venueAddress;
    }
    return 'Address TBD';
  };

  const getEventTime = (mainEvent?: Event) => {
    // Priority: settings.eventTime > mainEvent.time > fallback
    if (settings?.eventTime) {
      return settings.eventTime;
    }
    if (mainEvent?.time) {
      return mainEvent.time;
    }
    return 'Time TBD';
  };

  const getDressCode = (mainEvent?: Event) => {
    // Priority: settings.colorOfDay > mainEvent.dressCode > fallback
    if (settings?.colorOfDay) {
      return settings.colorOfDay;
    }
    if (mainEvent?.dressCode) {
      return mainEvent.dressCode;
    }
    return null;
  };

  // Get theme colors with defaults
  const primaryColor = settings?.theme?.primaryColor || '#6F4E37';
  const secondaryColor = settings?.theme?.secondaryColor || '#8B7355';
  const accentColor = settings?.theme?.accentColor || '#F5E9D3';

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, #ffffff 50%, ${accentColor}10 100%)`
        }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}
          />
          <p className="text-gray-600">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, #ffffff 50%, ${accentColor}10 100%)`
        }}
      >
        <div className="text-center">
          <p className="text-gray-600">Guest not found</p>
        </div>
      </div>
    );
  }

  // Get main event (or undefined if no events)
  const mainEvent = events.find(e => e.isMainEvent) || events[0];

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{
        background: `linear-gradient(135deg, ${accentColor}15 0%, #ffffff 50%, ${accentColor}10 100%)`
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Single Unified Card */}
        <div id="invitation-card" className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative Top Bar */}
          <div
            className="h-3"
            style={{
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          />

          <div className="p-6 sm:p-12">
            {/* Header Section */}
            <div className="text-center mb-8 pb-8 border-b border-gray-200">
              {/* Decorative Hearts */}
              <div className="flex justify-center items-center gap-4 mb-6">
                <div className="w-12 h-0.5" style={{backgroundColor: primaryColor}}/>
                <Heart className="w-8 h-8" style={{color: primaryColor, fill: primaryColor}}/>
                <div className="w-12 h-0.5" style={{backgroundColor: primaryColor}}/>
              </div>

              <h1
                  className="text-4xl sm:text-5xl font-serif font-bold mb-3"
                  style={{color: primaryColor}}
              >
                {getCoupleNames()}
              </h1>

              <p className="text-xl text-gray-600 mb-2">are getting married!</p>

              <p
                  className="text-2xl font-light tracking-wide mb-2"
                  style={{color: secondaryColor}}
              >
                {getEventTitle()}
              </p>

              {/* Personal Greeting */}
              <div className="mt-8">
                <p className="text-lg text-gray-700 mb-2">
                  Dear <span className="font-semibold" style={{color: primaryColor}}>{guest.name}</span>,
                </p>
                <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  We're delighted to invite you to celebrate our special day with us.
                  Your presence would mean the world to us as we begin this beautiful journey together.
                </p>
              </div>
            </div>

            {/* QR Code & PIN Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-6">
                {/* QR Code */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">Scan to RSVP</p>
                  <div className="bg-white p-4 rounded-xl border-2" style={{ borderColor: accentColor }}>
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="RSVP QR Code" className="w-32 h-32" />
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-32 bg-gray-200" />
                <div className="sm:hidden w-full h-px bg-gray-200" />

                {/* PIN Code */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">Your Verification Code</p>
                  <div
                    className="px-8 py-4 rounded-xl font-mono text-2xl font-bold tracking-wider"
                    style={{
                      backgroundColor: `${primaryColor}10`,
                      color: primaryColor,
                      border: `2px dashed ${primaryColor}`
                    }}
                  >
                    {guest.code}
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleDownloadInvitation}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: secondaryColor
                  }}
                  onMouseEnter={(e) => {
                    if (!downloading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Download className="w-5 h-5" />
                  {downloading ? 'Generating...' : 'Download Invitation'}
                </button>
              </div>
            </div>

            {/* Event Details Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2
                className="text-2xl font-serif font-semibold text-center mb-6"
                style={{ color: primaryColor }}
              >
                Event Details
              </h2>

              <div className="space-y-4 max-w-xl mx-auto">
                <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                  <Calendar className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-medium text-gray-900">Date</p>
                    <p className="text-gray-600">{getEventDate()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                  <Clock className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-medium text-gray-900">Time</p>
                    <p className="text-gray-600">{getEventTime(mainEvent)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                  <MapPin className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-medium text-gray-900">Venue</p>
                    <p className="text-gray-600">{getVenueName(mainEvent)}</p>
                    <p className="text-sm text-gray-500 mt-1">{getVenueAddress(mainEvent)}</p>
                  </div>
                </div>

                {getDressCode(mainEvent) && (
                  <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                    <Users className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                    <div>
                      <p className="font-medium text-gray-900">Dress Code</p>
                      <p className="text-gray-600">{getDressCode(mainEvent)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RSVP Form Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2
                className="text-2xl font-serif font-semibold text-center mb-6"
                style={{ color: primaryColor }}
              >
                {hasResponded ? 'Your RSVP' : 'Please Respond'}
              </h2>

              {hasResponded ? (
                /* Show Confirmation Status */
                <div className="max-w-xl mx-auto">
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      {guest.rsvpStatus ? (
                        <CheckCircle className="w-16 h-16" style={{ color: primaryColor }} />
                      ) : (
                        <XCircle className="w-16 h-16 text-gray-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: guest.rsvpStatus ? primaryColor : undefined }}>
                      Thank You for Your Response!
                    </h3>
                    <p className="text-gray-600">
                      {guest.rsvpStatus
                        ? "We have received your RSVP. We're looking forward to celebrating with you!"
                        : "We're sorry you can't make it. You'll be missed on our special day."}
                    </p>
                  </div>

                  <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`font-semibold ${guest.rsvpStatus ? '' : 'text-gray-600'}`} style={guest.rsvpStatus ? { color: primaryColor } : undefined}>
                        {guest.rsvpStatus ? 'Confirmed - Attending' : 'Regretfully Declined'}
                      </span>
                    </div>

                    {guest.rsvpStatus && guest.plusOneAllowed && (
                      <>
                        {guest.plusOneName && (
                          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Plus One:</span>
                            <span className="text-gray-900">{guest.plusOneName}</span>
                          </div>
                        )}
                        {guest.plusOneRsvp !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Plus One Status:</span>
                            <span className={guest.plusOneRsvp ? "text-green-600 font-medium" : "text-gray-500"}>
                              {guest.plusOneRsvp ? 'Attending' : 'Not Attending'}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Need to make changes?
                    </p>
                    <button
                      onClick={() => {
                        // Allow them to update their RSVP
                        setHasResponded(false);
                      }}
                      className="text-sm font-medium hover:underline"
                      style={{ color: secondaryColor }}
                    >
                      Update My RSVP
                    </button>
                  </div>
                </div>
              ) : (
                /* Show RSVP Form */
                <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
                {/* Attendance Buttons */}
                <div>
                  <label className="block text-center text-sm font-medium text-gray-700 mb-4">
                    Will you be attending?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rsvpStatus: true })}
                      className="py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
                      style={
                        formData.rsvpStatus
                          ? {
                              backgroundColor: primaryColor,
                              color: 'white',
                              boxShadow: `0 4px 12px ${primaryColor}40`
                            }
                          : {
                              backgroundColor: 'white',
                              color: primaryColor,
                              border: `2px solid ${primaryColor}30`
                            }
                      }
                    >
                      ✓ Joyfully Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rsvpStatus: false })}
                      className="py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
                      style={
                        !formData.rsvpStatus
                          ? {
                              backgroundColor: '#6b7280',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
                            }
                          : {
                              backgroundColor: 'white',
                              color: '#6b7280',
                              border: '2px solid #e5e7eb'
                            }
                      }
                    >
                      ✗ Regretfully Decline
                    </button>
                  </div>
                </div>

                {formData.rsvpStatus && guest.plusOneAllowed && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: primaryColor }}>
                      <Users className="w-5 h-5" />
                      Plus One Guest
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guest Name
                        </label>
                        <input
                          type="text"
                          value={formData.plusOneName}
                          onChange={(e) => setFormData({ ...formData, plusOneName: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                          style={{
                            borderColor: formData.plusOneName ? `${primaryColor}40` : undefined,
                            backgroundColor: formData.plusOneName ? `${accentColor}10` : undefined
                          }}
                          placeholder="Plus one's name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guest Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.plusOnePhone}
                          onChange={(e) => setFormData({ ...formData, plusOnePhone: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                          style={{
                            borderColor: formData.plusOnePhone ? `${primaryColor}40` : undefined,
                            backgroundColor: formData.plusOnePhone ? `${accentColor}10` : undefined
                          }}
                          placeholder="+234 xxx xxx xxxx"
                        />
                      </div>

                      <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.plusOneRsvp}
                          onChange={(e) => setFormData({ ...formData, plusOneRsvp: e.target.checked })}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          My plus one will be attending
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px ${primaryColor}40`
                  }}
                >
                  {submitting ? 'Submitting...' : 'Confirm RSVP'}
                </button>
              </form>
              )}
            </div>

            {/* Messages Section - Only show if enabled */}
            {settings?.enableMessages && (
              <div className="mb-8">
                <h2
                  className="text-2xl font-serif font-semibold text-center mb-2"
                  style={{ color: primaryColor }}
                >
                  Send Your Wishes
                </h2>
                <p className="text-center text-gray-600 mb-6">
                  Share a message for the happy couple
                </p>

                <form onSubmit={handleMessageSubmit} className="max-w-xl mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={messageData.guestName}
                      onChange={(e) => setMessageData({ ...messageData, guestName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={messageData.email}
                      onChange={(e) => setMessageData({ ...messageData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      value={messageData.message}
                      onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none resize-none"
                      rows={4}
                      placeholder="Share your wishes for the happy couple..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={messageSubmitting}
                    className="w-full py-4 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      backgroundColor: secondaryColor,
                      boxShadow: `0 4px 14px ${secondaryColor}40`
                    }}
                  >
                    {messageSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-gray-600 pt-6">
              <p className="text-lg mb-2">We can't wait to celebrate with you!</p>
              <p className="text-sm">
                For any questions, please contact us at{' '}
                <a
                  href={`tel:${guest.phoneNumber}`}
                  className="font-medium hover:underline"
                  style={{ color: primaryColor }}
                >
                  {guest.phoneNumber}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
