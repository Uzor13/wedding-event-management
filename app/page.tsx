'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/ui/navbar';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Tag as TagIcon, X } from 'lucide-react';

interface Couple {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function GuestForm() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const [couples, setCouples] = useState<Couple[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [plusOneAllowed, setPlusOneAllowed] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [mealPreference, setMealPreference] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const router = useRouter();

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

  useEffect(() => {
    const loadTags = async () => {
      if (!token) return;
      const targetCoupleId = isAdmin ? selectedCoupleId : coupleId;
      if (!targetCoupleId) return;

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: isAdmin ? { coupleId: targetCoupleId } : {}
          }
        );
        setTags(response.data);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };

    loadTags();
  }, [token, isAdmin, selectedCoupleId, coupleId]);

  const validatePhoneNumber = (phone: string): boolean => {
    setPhoneError('');

    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');

    // Check if it has at least 10 digits
    if (digitsOnly.length < 10) {
      setPhoneError('Phone number must have at least 10 digits');
      return false;
    }

    // Check if it has too many digits (max 15 for international numbers)
    if (digitsOnly.length > 15) {
      setPhoneError('Phone number cannot exceed 15 digits');
      return false;
    }

    // Check for valid characters (only numbers, spaces, +, -, (, ))
    const phoneRegex = /^[0-9\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Phone number can only contain numbers, spaces, +, -, (, )');
      return false;
    }

    return true;
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (phoneError && value.trim()) {
      // Clear error on typing if there was an error
      validatePhoneNumber(value);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setPhoneError('');

    const targetCoupleId = isAdmin ? selectedCoupleId : coupleId;
    if (!token) {
      router.push('/login');
      return;
    }
    if (!targetCoupleId) {
      setMessage('Select a couple before adding guests.');
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/add-guest`,
        {
          name,
          phoneNumber,
          coupleId: targetCoupleId,
          plusOneAllowed,
          plusOneName: plusOneAllowed ? plusOneName : undefined,
          mealPreference,
          dietaryRestrictions
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Add guest response:', response.data);
      console.log('Guest object:', response.data.guest);
      console.log('Guest ID:', response.data.guest?.id);

      // If tags are selected, assign them to the newly created guest
      if (selectedTags.length > 0 && response.data.guest?.id) {
        console.log('Attempting to assign tags:', selectedTags, 'to guest:', response.data.guest.id);
        try {
          const tagResponse = await axios.put(
            `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/guests/${response.data.guest.id}/assign-tags`,
            { tagIds: selectedTags },
            {
              headers: { Authorization: `Bearer ${token}` },
              params: isAdmin ? { coupleId: targetCoupleId } : {}
            }
          );
          console.log('Tag assignment response:', tagResponse.data);
        } catch (tagError: any) {
          console.error('Tag assignment failed:', tagError.response?.data || tagError.message);
          // Don't throw - guest was created successfully even if tags failed
        }
      } else {
        console.log('Skipping tag assignment - selectedTags:', selectedTags, 'guestId:', response.data.guest?.id);
      }

      setMessage('Guest added successfully.');
      setName('');
      setPhoneNumber('');
      setSelectedTags([]);
      setPlusOneAllowed(false);
      setPlusOneName('');
      setMealPreference('');
      setDietaryRestrictions('');
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        setMessage(error.response?.data?.message || 'Failed to add guest');
      }
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <>
      <NavBar />
      <div className="max-w-xl mx-auto mt-10">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-4">
          {isAdmin && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="couple">
                Couple
              </label>
              <select
                id="couple"
                value={selectedCoupleId || ''}
                onChange={(event) => setSelectedCoupleId(event.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                required
              >
                <option value="" disabled>Select couple</option>
                {couples.map((couple, index) => (
                  <option key={index} value={couple.id}>
                    {couple.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              className={`shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline ${
                phoneError ? 'border-red-500' : ''
              }`}
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(event) => handlePhoneChange(event.target.value)}
              placeholder="e.g., +234 123 456 7890"
              required
            />
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={plusOneAllowed}
                onChange={(e) => setPlusOneAllowed(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-700 text-sm font-bold">
                Allow Plus-One
              </span>
            </label>

            {plusOneAllowed && (
              <div className="mt-3 ml-6 space-y-3">
                <div>
                  <label className="block text-gray-700 text-sm mb-1">
                    Plus-One Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    placeholder="Guest's companion name"
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                <TagIcon className="inline w-4 h-4 mr-1" />
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.filter(tag => tag != null).map((tag, index) => {
                  const tagColor = tag?.color || '#6366f1';
                  return (
                    <button
                      key={tag.id || `tag-add-${index}`}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'ring-2 ring-indigo-500 bg-indigo-50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.id) && (
                        <X className="inline w-3 h-3 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Add Guest
            </button>
          </div>
        </form>
        {message && (
          <p className="text-center text-gray-700 font-bold">{message}</p>
        )}
      </div>
    </>
  );
}
