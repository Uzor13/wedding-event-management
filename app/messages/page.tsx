'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { MessageCircle, Check, X, Star, Trash2, Filter } from 'lucide-react';

interface Message {
  _id: string;
  guestName: string;
  email?: string;
  message: string;
  approved: boolean;
  featured: boolean;
  createdAt: string;
}

type FilterType = 'all' | 'pending' | 'approved';

export default function MessagesBoard() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const router = useRouter();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMessages();
  }, [token, currentCoupleId]);

  const fetchMessages = async () => {
    if (!currentCoupleId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (message: Message) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/messages/${message._id}`,
        { approved: !message.approved, featured: message.featured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(message.approved ? 'Message hidden' : 'Message approved!');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const toggleFeatured = async (message: Message) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/messages/${message._id}`,
        { approved: message.approved, featured: !message.featured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(message.featured ? 'Removed from featured' : 'Added to featured!');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/messages/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Message deleted');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'pending') return !msg.approved;
    if (filter === 'approved') return msg.approved;
    return true;
  });

  const pendingCount = messages.filter((m) => !m.approved).length;
  const approvedCount = messages.filter((m) => m.approved).length;

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              Messages Board
            </h1>
            <p className="text-gray-600 mt-1">Moderate and showcase guest wishes</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-2 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No {filter !== 'all' ? filter : ''} messages yet
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg._id}
                className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                  msg.featured
                    ? 'border-yellow-500 bg-yellow-50'
                    : msg.approved
                    ? 'border-green-500'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {msg.guestName}
                      </h3>
                      {msg.featured && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </span>
                      )}
                      {msg.approved ? (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          <Check className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          <Filter className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    {msg.email && (
                      <p className="text-sm text-gray-600 mb-2">{msg.email}</p>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleApproval(msg)}
                      className={`p-2 rounded-lg transition-colors ${
                        msg.approved
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={msg.approved ? 'Hide message' : 'Approve message'}
                    >
                      {msg.approved ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleFeatured(msg)}
                      className={`p-2 rounded-lg transition-colors ${
                        msg.featured
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={msg.featured ? 'Remove from featured' : 'Feature message'}
                    >
                      <Star className={`w-5 h-5 ${msg.featured ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
