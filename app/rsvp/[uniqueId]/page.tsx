'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Calendar, MapPin, Clock, Check, X, User, Users } from 'lucide-react';

interface Guest {
  _id: string;
  name: string;
  phoneNumber: string;
  uniqueId: string;
  rsvpStatus: boolean;
  plusOneAllowed: boolean;
  plusOneName?: string;
  plusOnePhone?: string;
  plusOneRsvp?: boolean;
  mealPreference?: string;
  plusOneMealPreference?: string;
  dietaryRestrictions?: string;
  plusOneDietaryRestrictions?: string;
  couple: {
    _id: string;
    name1: string;
    name2: string;
    weddingDate: string;
  };
}

interface Event {
  _id: string;
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  dressCode?: string;
  isMainEvent: boolean;
}

const MEAL_OPTIONS = [
  { value: '', label: 'Select preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' }
];

export default function RSVPPage({ params }: { params: Promise<{ uniqueId: string }> }) {
  const resolvedParams = use(params);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    plusOneRsvp: false,
    mealPreference: '',
    plusOneMealPreference: '',
    dietaryRestrictions: '',
    plusOneDietaryRestrictions: ''
  });

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
      setMessageData({
        guestName: guestData.name,
        email: '',
        message: ''
      });
      setFormData({
        rsvpStatus: guestData.rsvpStatus || false,
        plusOneName: guestData.plusOneName || '',
        plusOnePhone: guestData.plusOnePhone || '',
        plusOneRsvp: guestData.plusOneRsvp || false,
        mealPreference: guestData.mealPreference || '',
        plusOneMealPreference: guestData.plusOneMealPreference || '',
        dietaryRestrictions: guestData.dietaryRestrictions || '',
        plusOneDietaryRestrictions: guestData.plusOneDietaryRestrictions || ''
      });
    } catch (error) {
      toast.error('Guest not found');
    } finally {
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
          coupleId: guest?.couple._id,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Guest not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {guest.couple.name1} & {guest.couple.name2}
          </h1>
          <p className="text-xl text-gray-600">are getting married!</p>
          <p className="text-lg text-indigo-600 mt-2">
            {formatDate(guest.couple.weddingDate)}
          </p>
        </div>

        {/* Personal Greeting */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Dear {guest.name},
          </h2>
          <p className="text-gray-700">
            We're delighted to invite you to celebrate our special day with us. Please let us know
            if you can join us by completing the RSVP below.
          </p>
        </div>

        {/* Events */}
        {events.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h3>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event._id}
                  className={`p-4 rounded-lg border-l-4 ${
                    event.isMainEvent ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{event.eventName}</h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {event.venueName}, {event.venueAddress}
                      </span>
                    </div>
                    {event.dressCode && (
                      <p className="mt-2">
                        <span className="font-medium">Dress Code:</span> {event.dressCode}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RSVP Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">RSVP</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Attendance */}
            <div>
              <label className="block text-sm font-medium mb-3">Will you be attending?</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rsvpStatus: true })}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                    formData.rsvpStatus
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Yes, I'll be there!</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rsvpStatus: false })}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                    !formData.rsvpStatus
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Sorry, can't make it</span>
                </button>
              </div>
            </div>

            {formData.rsvpStatus && (
              <>
                {/* Meal Preference */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Your Meal Preference
                  </label>
                  <select
                    value={formData.mealPreference}
                    onChange={(e) => setFormData({ ...formData, mealPreference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {MEAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dietary Restrictions / Allergies
                  </label>
                  <input
                    type="text"
                    value={formData.dietaryRestrictions}
                    onChange={(e) =>
                      setFormData({ ...formData, dietaryRestrictions: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Gluten-free, Nut allergy"
                  />
                </div>

                {/* Plus One */}
                {guest.plusOneAllowed && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Plus One
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Guest Name</label>
                        <input
                          type="text"
                          value={formData.plusOneName}
                          onChange={(e) =>
                            setFormData({ ...formData, plusOneName: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Plus one's name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Guest Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.plusOnePhone}
                          onChange={(e) =>
                            setFormData({ ...formData, plusOnePhone: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="+234 xxx xxx xxxx"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.plusOneRsvp}
                            onChange={(e) =>
                              setFormData({ ...formData, plusOneRsvp: e.target.checked })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">My plus one will attend</span>
                        </label>
                      </div>

                      {formData.plusOneRsvp && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Plus One's Meal Preference
                            </label>
                            <select
                              value={formData.plusOneMealPreference}
                              onChange={(e) =>
                                setFormData({ ...formData, plusOneMealPreference: e.target.value })
                              }
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              {MEAL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Plus One's Dietary Restrictions
                            </label>
                            <input
                              type="text"
                              value={formData.plusOneDietaryRestrictions}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  plusOneDietaryRestrictions: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg"
                              placeholder="e.g., Gluten-free, Nut allergy"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit RSVP'}
            </button>
          </form>
        </div>

        {/* Send a Message */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Send Your Wishes</h3>
          <form onSubmit={handleMessageSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name *</label>
              <input
                type="text"
                value={messageData.guestName}
                onChange={(e) => setMessageData({ ...messageData, guestName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (Optional)</label>
              <input
                type="email"
                value={messageData.email}
                onChange={(e) => setMessageData({ ...messageData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Message *</label>
              <textarea
                value={messageData.message}
                onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Share your wishes for the happy couple..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={messageSubmitting}
              className="w-full py-3 px-4 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {messageSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm">
          <p>We can't wait to celebrate with you!</p>
          <p className="mt-2">
            For any questions, please contact us at{' '}
            <a href={`tel:${guest.phoneNumber}`} className="text-indigo-600 hover:underline">
              {guest.phoneNumber}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
