'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { Calendar, Plus, Trash2, Edit2, MapPin, Clock, Users as UsersIcon, Star, X } from 'lucide-react';

interface Event {
  id: string;
  eventName: string;
  eventType: 'rehearsal' | 'ceremony' | 'reception' | 'after-party' | 'other';
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  description?: string;
  dressCode?: string;
  guestList: any[];
  isMainEvent: boolean;
}

interface Couple {
  id: string;
  name: string;
}

const EVENT_TYPES = [
  { value: 'rehearsal', label: 'Rehearsal Dinner' },
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'after-party', label: 'After Party' },
  { value: 'other', label: 'Other' }
];

export default function EventsPage() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const [events, setEvents] = useState<Event[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'ceremony',
    date: '',
    time: '',
    venueName: '',
    venueAddress: '',
    description: '',
    dressCode: '',
    isMainEvent: false
  });
  const router = useRouter();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchEvents();
  }, [token, currentCoupleId]);

  useEffect(() => {
    const loadCouples = async () => {
      if (!isAdmin || !token) return;
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/couples`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCouples(response.data);
        if (!selectedCoupleId && response.data.length > 0) {
          setSelectedCoupleId(response.data[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadCouples();
  }, [isAdmin, token, selectedCoupleId, setSelectedCoupleId]);

  const fetchEvents = async () => {
    if (!currentCoupleId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/events`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCoupleId) {
      toast.error('Please select a couple first');
      return;
    }

    try {
      if (editingEvent) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/events/${editingEvent.id}`,
          {
            ...formData,
            guestList: editingEvent.guestList.map((g: any) => g.id || g)
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Event updated!');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/events`,
          {
            ...formData,
            coupleId: currentCoupleId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Event created!');
      }

      setShowDialog(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/events/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Event deleted');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      eventName: event.eventName,
      eventType: event.eventType,
      date: event.date.split('T')[0],
      time: event.time,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      description: event.description || '',
      dressCode: event.dressCode || '',
      isMainEvent: event.isMainEvent
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      eventName: '',
      eventType: 'ceremony',
      date: '',
      time: '',
      venueName: '',
      venueAddress: '',
      description: '',
      dressCode: '',
      isMainEvent: false
    });
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

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Couple Selector for Admin */}
        {isAdmin && couples.length > 0 && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Couple
            </label>
            <select
              value={selectedCoupleId || ''}
              onChange={(e) => setSelectedCoupleId(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {couples.map((couple) => (
                <option key={couple.id} value={couple.id}>
                  {couple.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Events
            </h1>
            <p className="text-gray-600 mt-1">Manage your wedding events</p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              resetForm();
              setShowDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            disabled={!currentCoupleId}
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No events yet. Create your first event to get started.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                  event.isMainEvent ? 'border-indigo-600' : 'border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {event.eventName}
                      </h3>
                      {event.isMainEvent && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Main Event
                        </span>
                      )}
                      <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        {EVENT_TYPES.find((t) => t.value === event.eventType)?.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>
                          {event.venueName} - {event.venueAddress}
                        </span>
                      </div>
                      {event.dressCode && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Dress Code: <span className="font-medium">{event.dressCode}</span>
                          </span>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <UsersIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {event.guestList.length} guest{event.guestList.length !== 1 ? 's' : ''} invited
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Event Name *</label>
                    <input
                      type="text"
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Event Type *</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) =>
                        setFormData({ ...formData, eventType: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Time *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Venue Name *</label>
                    <input
                      type="text"
                      value={formData.venueName}
                      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Venue Address *</label>
                    <input
                      type="text"
                      value={formData.venueAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, venueAddress: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Dress Code</label>
                    <input
                      type="text"
                      value={formData.dressCode}
                      onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Black Tie, Cocktail"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isMainEvent}
                        onChange={(e) =>
                          setFormData({ ...formData, isMainEvent: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Mark as Main Event</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      placeholder="Optional event details"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDialog(false);
                      setEditingEvent(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    {editingEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
