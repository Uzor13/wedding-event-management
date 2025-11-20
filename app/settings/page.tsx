'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { Spinner } from '@/components/ui/spinner';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import {
  Calendar, Clock, MapPin, Users, Palette,
  Save, Settings as SettingsIcon, Eye
} from 'lucide-react';

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  qrBackgroundColor: string;
  qrTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

interface SettingsData {
  eventTitle: string;
  coupleNames: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  colorOfDay: string;
  theme: Theme;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    eventTitle: '',
    coupleNames: '',
    eventDate: '',
    eventTime: '',
    venueName: '',
    venueAddress: '',
    colorOfDay: '',
    theme: {
      primaryColor: '#6F4E37',
      secondaryColor: '#8B7355',
      accentColor: '#F5E9D3',
      backgroundColor: '#FFFFFF',
      textColor: '#3D2B1F',
      qrBackgroundColor: '#F9FAFB',
      qrTextColor: '#111827',
      buttonColor: '#6F4E37',
      buttonTextColor: '#FFFFFF'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [couples, setCouples] = useState<any[]>([]);
  const [currentCouple, setCurrentCouple] = useState<any>(null);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

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
      } catch (err) {
        console.error(err);
      }
    };
    loadCouples();
  }, [isAdmin, token, selectedCoupleId, setSelectedCoupleId]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) {
        router.push('/login');
        // Keep loading true during redirect
        return;
      }

      if (isAdmin && !currentCoupleId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch couple data to use as defaults
        let coupleData = null;
        if (currentCoupleId) {
          try {
            const coupleResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/couples`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            coupleData = coupleResponse.data.find((c: any) => c.id === currentCoupleId);
            setCurrentCouple(coupleData);
          } catch (e) {
            console.error('Failed to fetch couple data');
          }
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
          }
        );

        // Convert date format from "November 9, 2024" to "2024-11-09"
        const eventDate = response.data.eventDate || (coupleData?.weddingDate || '');
        let formattedDate = eventDate;
        try {
          const date = new Date(eventDate);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          // Keep original format if parsing fails
        }

        // Convert time format from "2:00 PM" to "14:00" for time input
        let formattedTime = response.data.eventTime || '';
        if (formattedTime && (formattedTime.includes('AM') || formattedTime.includes('PM'))) {
          try {
            const timeMatch = formattedTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              const minutes = timeMatch[2];
              const period = timeMatch[3].toUpperCase();

              // Convert to 24-hour format
              if (period === 'PM' && hours !== 12) {
                hours += 12;
              } else if (period === 'AM' && hours === 12) {
                hours = 0;
              }

              formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            }
          } catch (e) {
            console.error('Failed to parse time:', e);
          }
        }

        // Use couple data as fallback for empty fields
        setSettings({
          ...response.data,
          coupleNames: response.data.coupleNames || coupleData?.name || '',
          eventDate: formattedDate,
          eventTime: formattedTime,
          eventTitle: response.data.eventTitle || '',
          venueName: response.data.venueName || '',
          venueAddress: response.data.venueAddress || '',
          colorOfDay: response.data.colorOfDay || ''
        });

        // Add small delay to ensure content is rendered before hiding loading
        setTimeout(() => setLoading(false), 100);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
          // Keep loading true during redirect
        } else {
          toast.error('Failed to load settings');
          setLoading(false);
        }
      }
    };

    fetchSettings();
  }, [token, currentCoupleId, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert date format from "2024-11-09" to "November 9, 2024"
      const date = new Date(settings.eventDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Convert time format from "14:00" to "2:00 PM" if time is provided
      let formattedTime = settings.eventTime;
      if (settings.eventTime && settings.eventTime.includes(':')) {
        const [hours, minutes] = settings.eventTime.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        formattedTime = `${displayHour}:${minutes} ${ampm}`;
      }

      const payload = {
        ...settings,
        eventDate: formattedDate,
        eventTime: formattedTime || undefined, // Send undefined instead of empty string
        ...(isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {})
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Settings saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleThemeChange = (field: keyof Theme, value: string) => {
    setSettings(prev => ({
      ...prev,
      theme: { ...prev.theme, [field]: value }
    }));
  };

  const ColorPickerField = ({
    label,
    field,
    description
  }: {
    label: string;
    field: keyof Theme;
    description?: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform"
          style={{ backgroundColor: settings.theme[field] }}
          onClick={() => setActiveColorPicker(activeColorPicker === field ? null : field)}
        />
        <input
          type="text"
          value={settings.theme[field]}
          onChange={(e) => handleThemeChange(field, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      {activeColorPicker === field && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <HexColorPicker
            color={settings.theme[field]}
            onChange={(color) => handleThemeChange(field, color)}
          />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Configure your event details and customize the theme</p>
        </div>

        {isAdmin && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Couple
            </label>
            <select
              value={selectedCoupleId || ''}
              onChange={(e) => setSelectedCoupleId(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select couple</option>
              {couples.map((couple, index) => (
                <option key={index} value={couple.id}>
                  {couple.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(!isAdmin || currentCoupleId) ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Details Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={settings.eventTitle}
                    onChange={(e) => handleInputChange('eventTitle', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Couple Names
                  </label>
                  <input
                    type="text"
                    value={settings.coupleNames}
                    onChange={(e) => handleInputChange('coupleNames', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={settings.eventDate}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Event Time
                  </label>
                  <input
                    type="time"
                    value={settings.eventTime}
                    onChange={(e) => handleInputChange('eventTime', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={settings.venueName}
                    onChange={(e) => handleInputChange('venueName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Address
                  </label>
                  <textarea
                    value={settings.venueAddress}
                    onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="inline w-4 h-4 mr-1" />
                    Color of the Day
                  </label>
                  <input
                    type="text"
                    value={settings.colorOfDay}
                    onChange={(e) => handleInputChange('colorOfDay', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., White, Coffee and Beige"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Theme Customization Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Theme Customization</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ColorPickerField
                  label="Primary Color"
                  field="primaryColor"
                  description="Main brand color"
                />
                <ColorPickerField
                  label="Secondary Color"
                  field="secondaryColor"
                  description="Complementary color"
                />
                <ColorPickerField
                  label="Accent Color"
                  field="accentColor"
                  description="Highlight color"
                />
                <ColorPickerField
                  label="Background Color"
                  field="backgroundColor"
                  description="Page background"
                />
                <ColorPickerField
                  label="Text Color"
                  field="textColor"
                  description="Main text color"
                />
                <ColorPickerField
                  label="Button Color"
                  field="buttonColor"
                  description="Call-to-action buttons"
                />
                <ColorPickerField
                  label="Button Text Color"
                  field="buttonTextColor"
                  description="Text on buttons"
                />
                <ColorPickerField
                  label="QR Background"
                  field="qrBackgroundColor"
                  description="QR code card background"
                />
                <ColorPickerField
                  label="QR Text Color"
                  field="qrTextColor"
                  description="Text on QR card"
                />
              </div>

              {/* Theme Preview */}
              {showPreview && (
                <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-gray-300">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
                  <div
                    className="p-6 rounded-lg shadow-lg"
                    style={{
                      backgroundColor: settings.theme.backgroundColor,
                      color: settings.theme.textColor
                    }}
                  >
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ color: settings.theme.primaryColor }}
                    >
                      {settings.eventTitle}
                    </h2>
                    <p
                      className="text-lg mb-4"
                      style={{ color: settings.theme.secondaryColor }}
                    >
                      {settings.coupleNames}
                    </p>
                    <div
                      className="inline-block px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: settings.theme.accentColor,
                        color: settings.theme.textColor
                      }}
                    >
                      {new Date(settings.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <button
                      type="button"
                      className="mt-4 px-6 py-3 rounded-lg font-semibold transition-colors"
                      style={{
                        backgroundColor: settings.theme.buttonColor,
                        color: settings.theme.buttonTextColor
                      }}
                    >
                      Sample Button
                    </button>
                    <div
                      className="mt-4 p-4 rounded-lg"
                      style={{
                        backgroundColor: settings.theme.qrBackgroundColor,
                        color: settings.theme.qrTextColor
                      }}
                    >
                      QR Code Card Preview
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Couple Selected</h3>
            <p className="text-gray-600">Please select a couple to manage their settings</p>
          </div>
        )}
      </div>
    </>
  );
}
