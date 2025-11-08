'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import Alert from '@/components/ui/alert';
import { Trash, Send, ClipboardCopy } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

interface Guest {
  _id: string;
  name: string;
  phoneNumber: string;
  rsvpStatus: boolean;
  uniqueId: string;
  code: string;
  isUsed: boolean;
  tags: any[];
}

interface Couple {
  _id: string;
  name: string;
}

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ type: 'success' as 'success' | 'error' | 'warning', message: '', visible: false });
  const [couples, setCouples] = useState<Couple[]>([]);

  const router = useRouter();
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

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
          setSelectedCoupleId(response.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCouples();
  }, [isAdmin, token, selectedCoupleId, setSelectedCoupleId]);

  const fetchGuests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    if (isAdmin && !currentCoupleId) {
      setGuests([]);
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/guests`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }
      );
      setGuests(response.data);
      setLoading(false);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      }
      setError('Failed to fetch guests');
      setLoading(false);
    }
  }, [token, currentCoupleId, isAdmin, router]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleCopy = (id: string) => {
    setCopySuccess({ ...copySuccess, [id]: true });
    setTimeout(() => {
      setCopySuccess({ ...copySuccess, [id]: false });
    }, 2000);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    let cleanedNumber = phoneNumber.replace(/\s+/g, '').replace(/^\+?234/, '');
    cleanedNumber = cleanedNumber.replace(/^0/, '');
    return '234' + cleanedNumber;
  };

  const sendSMS = async (phoneNumber: string, link: string, guestName: string) => {
    if (!token || (isAdmin && !currentCoupleId)) {
      setAlert({
        type: 'error',
        message: 'Select a couple before sending SMS.',
        visible: true,
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/send-sms`,
        {
          name: guestName,
          phoneNumber: formattedPhone,
          link: link,
          coupleId: currentCoupleId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setAlert({
        type: 'success',
        message: 'SMS sent successfully!',
        visible: true,
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Sorry, SMS was not sent',
        visible: true,
      });
    }
  };

  const deleteGuest = async (phoneNumber: string) => {
    if (!token || (isAdmin && !currentCoupleId)) {
      setAlert({
        type: 'error',
        message: 'Select a couple before deleting guests.',
        visible: true,
      });
      return;
    }

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/delete/${phoneNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      await fetchGuests();
      setAlert({
        type: 'success',
        message: 'Guest deleted successfully!',
        visible: true,
      });
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Error deleting guest',
        visible: true,
      });
    }
  };

  const filteredGuests = guests.filter((guest) =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.phoneNumber.includes(searchQuery)
  );

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Guest List</h1>

        {isAdmin && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Couple
            </label>
            <select
              value={selectedCoupleId || ''}
              onChange={(e) => setSelectedCoupleId(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Select couple</option>
              {couples.map((couple) => (
                <option key={couple._id} value={couple._id}>
                  {couple.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        {loading ? (
          <p>Loading guests...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Phone</th>
                  <th className="py-3 px-4 text-left">RSVP Status</th>
                  <th className="py-3 px-4 text-left">Verified</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => {
                  const link = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guest.uniqueId}`;
                  return (
                    <tr key={guest._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{guest.name}</td>
                      <td className="py-3 px-4">{guest.phoneNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${guest.rsvpStatus ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                          {guest.rsvpStatus ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${guest.isUsed ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                          {guest.isUsed ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <CopyToClipboard text={link} onCopy={() => handleCopy(guest._id)}>
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              title="Copy Link"
                            >
                              <ClipboardCopy size={18} />
                            </button>
                          </CopyToClipboard>
                          <button
                            onClick={() => sendSMS(guest.phoneNumber, link, guest.name)}
                            className="text-green-600 hover:text-green-800"
                            title="Send SMS"
                          >
                            <Send size={18} />
                          </button>
                          <button
                            onClick={() => deleteGuest(guest.phoneNumber)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                        {copySuccess[guest._id] && (
                          <span className="text-xs text-green-600 ml-2">Copied!</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {alert.visible && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ ...alert, visible: false })}
          />
        )}
      </div>
    </>
  );
}
