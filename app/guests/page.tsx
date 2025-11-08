'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { exportToCSV } from '@/lib/utils/export';
import { generateInvitationPDF, downloadInvitationPDF } from '@/lib/utils/pdfGenerator';
import NavBar from '@/components/ui/navbar';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users, Search, Filter, Download, Trash2, Send,
  Edit, Copy, Check, X, ChevronLeft, ChevronRight,
  Mail, Tag as TagIcon, AlertCircle, MoreVertical,
  CheckSquare, Square, FileText, Plus
} from 'lucide-react';
import React from 'react';

interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface Guest {
  _id: string;
  name: string;
  phoneNumber: string;
  rsvpStatus: boolean;
  uniqueId: string;
  code: string;
  isUsed: boolean;
  tags: Tag[];
  plusOneAllowed: boolean;
  plusOneName?: string;
  plusOnePhone?: string;
  plusOneRsvp?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'verified'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showAssignTagDialog, setShowAssignTagDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [couples, setCouples] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [eventSettings, setEventSettings] = useState<any>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phoneNumber: ''
  });
  const [editPhoneError, setEditPhoneError] = useState('');

  const router = useRouter();
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const loadCouples = async () => {
      if (!isAdmin) return;
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
  }, [isAdmin, token, selectedCoupleId, setSelectedCoupleId, router]);

  const fetchData = useCallback(async () => {
    if (!token || (isAdmin && !currentCoupleId)) {
      setGuests([]);
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const [guestsRes, tagsRes, settingsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/guests`, {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags`, {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        })
      ]);

      setGuests(guestsRes.data);
      setTags(tagsRes.data);
      setEventSettings(settingsRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, [token, currentCoupleId, isAdmin, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort guests
  const filteredGuests = guests
    .filter((guest) => {
      const matchesSearch =
        guest.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        guest.phoneNumber.includes(debouncedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'confirmed' && guest.rsvpStatus) ||
        (statusFilter === 'pending' && !guest.rsvpStatus) ||
        (statusFilter === 'verified' && guest.isUsed);

      const matchesTag =
        tagFilter === 'all' ||
        guest.tags.some((tag) => tag._id === tagFilter);

      return matchesSearch && matchesStatus && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0; // Date sorting would require createdAt field
    });

  // Pagination
  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGuests = filteredGuests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, tagFilter]);

  const toggleSelectGuest = (guestId: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId);
    } else {
      newSelected.add(guestId);
    }
    setSelectedGuests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedGuests.size === paginatedGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(paginatedGuests.map((g) => g._id)));
    }
  };

  const copyToClipboard = async (text: string, guestId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(guestId);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    let cleaned = phoneNumber.replace(/\s+/g, '').replace(/^\+?234/, '');
    cleaned = cleaned.replace(/^0/, '');
    return '234' + cleaned;
  };

  const sendSMS = async (guest: Guest) => {
    if (!currentCoupleId && isAdmin) {
      toast.error('Please select a couple first');
      return;
    }

    try {
      const link = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guest.uniqueId}`;
      const formatted = formatPhoneNumber(guest.phoneNumber);

      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/send-sms`,
        {
          name: guest.name,
          phoneNumber: formatted,
          link,
          coupleId: currentCoupleId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`SMS sent to ${guest.name}`);
    } catch (err) {
      toast.error('Failed to send SMS');
    }
  };

  const validateEditPhoneNumber = (phone: string): boolean => {
    setEditPhoneError('');

    if (!phone.trim()) {
      setEditPhoneError('Phone number is required');
      return false;
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');

    // Check if it has at least 10 digits
    if (digitsOnly.length < 10) {
      setEditPhoneError('Phone number must have at least 10 digits');
      return false;
    }

    // Check if it has too many digits (max 15 for international numbers)
    if (digitsOnly.length > 15) {
      setEditPhoneError('Phone number cannot exceed 15 digits');
      return false;
    }

    // Check for valid characters (only numbers, spaces, +, -, (, ))
    const phoneRegex = /^[0-9\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      setEditPhoneError('Phone number can only contain numbers, spaces, +, -, (, )');
      return false;
    }

    return true;
  };

  const handleEditPhoneChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, phoneNumber: value }));
    if (editPhoneError && value.trim()) {
      // Clear error on typing if there was an error
      validateEditPhoneNumber(value);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    // Validate phone number
    if (!validateEditPhoneNumber(editFormData.phoneNumber)) {
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/guests/${selectedGuest._id}`,
        {
          name: editFormData.name,
          phoneNumber: editFormData.phoneNumber
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }
      );

      await fetchData();
      toast.success('Guest updated successfully');
      setShowEditDialog(false);
      setSelectedGuest(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update guest');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGuest = async (phoneNumber: string) => {
    setSubmitting(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/delete/${phoneNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );

      await fetchData();
      toast.success('Guest deleted successfully');
      setShowDeleteDialog(false);
      setSelectedGuest(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete guest');
    } finally {
      setSubmitting(false);
    }
  };

  const bulkDelete = async () => {
    setSubmitting(true);
    const guestsToDelete = Array.from(selectedGuests);

    try {
      await Promise.all(
        guestsToDelete.map((guestId) => {
          const guest = guests.find((g) => g._id === guestId);
          if (!guest) return Promise.resolve();

          return axios.delete(
            `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/delete/${guest.phoneNumber}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: isAdmin ? { coupleId: currentCoupleId } : {}
            }
          );
        })
      );

      await fetchData();
      toast.success(`${guestsToDelete.length} guests deleted`);
      setSelectedGuests(new Set());
      setShowBulkDeleteDialog(false);
    } catch (err) {
      toast.error('Failed to delete some guests');
    } finally {
      setSubmitting(false);
    }
  };

  const exportGuests = () => {
    exportToCSV(filteredGuests, 'wedding-guests.csv');
    toast.success('Guest list exported successfully');
  };

  const generatePDF = async (guest: Guest) => {
    if (!eventSettings) {
      toast.error('Event settings not loaded');
      return;
    }

    try {
      const rsvpLink = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guest.uniqueId}`;

      const guestInfo = {
        name: guest.name,
        phoneNumber: guest.phoneNumber,
        uniqueId: guest.uniqueId,
        code: guest.code
      };

      const eventDetails = {
        eventTitle: eventSettings.eventTitle,
        coupleNames: eventSettings.coupleNames,
        eventDate: eventSettings.eventDate,
        eventTime: eventSettings.eventTime,
        venueName: eventSettings.venueName,
        venueAddress: eventSettings.venueAddress,
        colorOfDay: eventSettings.colorOfDay
      };

      const theme = {
        primaryColor: eventSettings.theme?.primaryColor || '#6F4E37',
        secondaryColor: eventSettings.theme?.secondaryColor || '#8B7355',
        accentColor: eventSettings.theme?.accentColor || '#F5E9D3'
      };

      toast.info('Generating PDF invitation...');
      const pdfBlob = await generateInvitationPDF(guestInfo, eventDetails, theme, rsvpLink);
      downloadInvitationPDF(pdfBlob, guest.name);
      toast.success(`PDF invitation generated for ${guest.name}`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF invitation');
    }
  };

  const openEmailDialog = (guest: Guest) => {
    setSelectedGuest(guest);
    setEmailAddress(guest.phoneNumber.includes('@') ? guest.phoneNumber : '');
    setShowEmailDialog(true);
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest || !emailAddress) return;

    setSubmitting(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/send-email`,
        {
          guestId: selectedGuest._id,
          email: emailAddress,
          coupleId: currentCoupleId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Email invitation sent to ${emailAddress}`);
      setShowEmailDialog(false);
      setEmailAddress('');
      setSelectedGuest(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (guest: Guest) => {
    setSelectedGuest(guest);
    setEditFormData({
      name: guest.name,
      phoneNumber: guest.phoneNumber
    });
    setEditPhoneError('');
    setShowEditDialog(true);
  };

  const openAssignTagDialog = (guest: Guest) => {
    setSelectedGuest(guest);
    setSelectedTagIds(guest.tags?.map(t => t._id) || []);
    setShowAssignTagDialog(true);
  };

  const handleAssignTags = async () => {
    if (!selectedGuest) return;

    setSubmitting(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/guests/${selectedGuest._id}/assign-tags`,
        { tagIds: selectedTagIds },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }
      );

      await fetchData();
      setShowAssignTagDialog(false);
      toast.success('Tags updated successfully!');
      setSelectedGuest(null);
      setSelectedTagIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update tags');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

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
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-gray-900" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Guest List</h1>
              </div>
              <p className="text-gray-600">
                {filteredGuests.length} {filteredGuests.length === 1 ? 'guest' : 'guests'}
                {selectedGuests.size > 0 && ` • ${selectedGuests.size} selected`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Guest
              </button>
              <button
                onClick={exportGuests}
                disabled={filteredGuests.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Couple Selection */}
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
              {couples.map((couple) => (
                <option key={couple._id} value={couple._id}>
                  {couple.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(!isAdmin || currentCoupleId) ? (
          <>
            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>

                {/* Tag Filter */}
                <div>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Tags</option>
                    {tags.map((tag) => (
                      <option key={tag._id} value={tag._id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedGuests.size > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowBulkDeleteDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedGuests.size})
                  </button>
                </div>
              )}
            </div>

            {/* Guest Table/Cards */}
            {paginatedGuests.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <button
                              onClick={toggleSelectAll}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {selectedGuests.size === paginatedGuests.length ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">RSVP</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Verified</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Plus One</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tags</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedGuests.map((guest) => {
                          const link = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guest.uniqueId}`;
                          return (
                            <tr key={guest._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => toggleSelectGuest(guest._id)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  {selectedGuests.has(guest._id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{guest.name}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-gray-600 font-mono text-sm">{guest.phoneNumber}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    guest.rsvpStatus
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  {guest.rsvpStatus ? 'Confirmed' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    guest.isUsed
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {guest.isUsed ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {guest.plusOneAllowed ? (
                                  guest.plusOneName ? (
                                    <div className="text-sm">
                                      <p className="font-medium text-gray-900">{guest.plusOneName}</p>
                                      <span
                                        className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                          guest.plusOneRsvp
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-orange-100 text-orange-700'
                                        }`}
                                      >
                                        {guest.plusOneRsvp ? 'Confirmed' : 'Pending'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Allowed, not added</span>
                                  )
                                ) : (
                                  <span className="text-gray-400 text-xs">Not allowed</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {guest.tags && guest.tags.length > 0 ? (
                                    guest.tags.filter(tag => tag != null).slice(0, 2).map((tag, index) => {
                                      const tagColor = tag?.color || '#3b82f6';
                                      return (
                                        <span
                                          key={tag._id || `tag-${guest._id}-${index}`}
                                          className="px-2 py-1 rounded text-xs"
                                          style={{
                                            backgroundColor: tagColor + '20',
                                            color: tagColor
                                          }}
                                        >
                                          {tag.name}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-gray-400 text-xs">No tags</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => copyToClipboard(link, guest._id)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Copy RSVP Link"
                                  >
                                    {copiedId === guest._id ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => sendSMS(guest)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Send SMS"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openEmailDialog(guest)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Send Email Invitation"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openEditDialog(guest)}
                                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openAssignTagDialog(guest)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Manage Tags"
                                  >
                                    <TagIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => generatePDF(guest)}
                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="Generate PDF Invitation"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedGuest(guest);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 mb-6">
                  {paginatedGuests.map((guest) => {
                    const link = `${process.env.NEXT_PUBLIC_SITE_LINK}/rsvp/${guest.uniqueId}`;
                    return (
                      <div key={guest._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleSelectGuest(guest._id)}
                              className="mt-1"
                            >
                              {selectedGuests.has(guest._id) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            <div>
                              <h3 className="font-semibold text-gray-900">{guest.name}</h3>
                              <p className="text-sm text-gray-600 font-mono mt-1">{guest.phoneNumber}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              guest.rsvpStatus
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {guest.rsvpStatus ? 'Confirmed' : 'Pending'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              guest.isUsed
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {guest.isUsed ? 'Verified' : 'Not Verified'}
                          </span>
                          {guest.tags && guest.tags.filter(tag => tag != null).map((tag, index) => {
                            const tagColor = tag?.color || '#3b82f6';
                            return (
                              <span
                                key={tag._id || `tag-${guest._id}-${index}`}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: tagColor + '20',
                                  color: tagColor
                                }}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>

                        {guest.plusOneAllowed && guest.plusOneName && (
                          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Plus One:</p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{guest.plusOneName}</p>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  guest.plusOneRsvp
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {guest.plusOneRsvp ? 'Confirmed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(link, guest._id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          >
                            {copiedId === guest._id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            Copy
                          </button>
                          <button
                            onClick={() => sendSMS(guest)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                          >
                            <Send className="w-4 h-4" />
                            SMS
                          </button>
                          <button
                            onClick={() => openEmailDialog(guest)}
                            className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditDialog(guest)}
                            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAssignTagDialog(guest)}
                            className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Manage Tags"
                          >
                            <TagIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generatePDF(guest)}
                            className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Generate PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGuest(guest);
                              setShowDeleteDialog(true);
                            }}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredGuests.length)} of {filteredGuests.length} guests
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            return (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            );
                          })
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 rounded-lg transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Guests Found</h3>
                <p className="text-gray-600">
                  {debouncedSearch || statusFilter !== 'all' || tagFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by adding guests to your event'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Couple Selected</h3>
            <p className="text-gray-600">Please select a couple to view their guests</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Guest</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editFormData.phoneNumber}
                  onChange={(e) => handleEditPhoneChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    editPhoneError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., +234 123 456 7890"
                  required
                />
                {editPhoneError && (
                  <p className="text-red-500 text-xs mt-1">{editPhoneError}</p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Assign Tags Dialog */}
        <Dialog open={showAssignTagDialog} onOpenChange={setShowAssignTagDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-indigo-600" />
                  Manage Tags for {selectedGuest?.name}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {tags.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600">
                    Select tags to assign to this guest
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {tags.filter(tag => tag != null).map((tag, index) => {
                      const tagColor = tag?.color || '#6366f1';
                      return (
                        <button
                          key={tag._id || `tag-dialog-${index}`}
                          type="button"
                          onClick={() => toggleTagSelection(tag._id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            selectedTagIds.includes(tag._id)
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {selectedTagIds.includes(tag._id) ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: tagColor + '20' }}
                          >
                            <TagIcon className="w-5 h-5" style={{ color: tagColor }} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">{tag.name}</p>
                            <p className="text-sm text-gray-500">{tagColor}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedTagIds.length} {selectedTagIds.length === 1 ? 'tag' : 'tags'} selected
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tags available</p>
                  <p className="text-sm text-gray-500 mt-1">Create tags first to assign them to guests</p>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignTagDialog(false);
                    setSelectedGuest(null);
                    setSelectedTagIds([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTags}
                  disabled={submitting || tags.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <TagIcon className="w-4 h-4" />
                      Save Tags
                    </>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Are you sure?</p>
                  <p className="text-sm text-red-700">
                    This will permanently delete <strong>{selectedGuest?.name}</strong>. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedGuest && deleteGuest(selectedGuest.phoneNumber)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Guest
                    </>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Multiple Guests</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Are you sure?</p>
                  <p className="text-sm text-red-700">
                    This will permanently delete <strong>{selectedGuests.size} guests</strong>. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkDeleteDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={bulkDelete}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete {selectedGuests.size} Guests
                    </>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email Invitation</DialogTitle>
            </DialogHeader>
            <form onSubmit={sendEmail} className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Sending invitation to <strong>{selectedGuest?.name}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="guest@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  A beautifully formatted HTML invitation will be sent with RSVP link and QR code
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Note:</strong> Make sure your email service is configured in environment variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD)
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEmailDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
