'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { Spinner } from '@/components/ui/spinner';
import { Users, UserCheck, UserX, QrCode, Tag, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Guest {
  _id: string;
  name: string;
  rsvpStatus: boolean;
  isUsed: boolean;
  tags: any[];
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  verified: number;
  byTag: { name: string; count: number }[];
}

export default function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couples, setCouples] = useState<any[]>([]);
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
          setSelectedCoupleId(response.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCouples();
  }, [isAdmin, token, selectedCoupleId, setSelectedCoupleId]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    if (isAdmin && !currentCoupleId) {
      setGuests([]);
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const [guestsRes, tagsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/guests`, {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags`, {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        })
      ]);

      setGuests(guestsRes.data);
      setTags(tagsRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, currentCoupleId, isAdmin, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats: Stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvpStatus).length,
    pending: guests.filter(g => !g.rsvpStatus).length,
    verified: guests.filter(g => g.isUsed).length,
    byTag: tags.map(tag => ({
      name: tag.name,
      count: tag.users?.length || 0
    }))
  };

  const pieData = [
    { name: 'Confirmed', value: stats.confirmed, color: '#10b981' },
    { name: 'Pending', value: stats.pending, color: '#f59e0b' }
  ];

  const verificationData = [
    { name: 'Verified', count: stats.verified, fill: '#3b82f6' },
    { name: 'Not Verified', count: stats.total - stats.verified, fill: '#94a3b8' }
  ];

  const StatCard = ({ icon: Icon, title, value, color, subtitle }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your wedding guest management</p>
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
              {couples.map((couple) => (
                <option key={couple.id} value={couple.id}>
                  {couple.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Guests"
            value={stats.total}
            color="text-blue-600"
          />
          <StatCard
            icon={UserCheck}
            title="Confirmed RSVP"
            value={stats.confirmed}
            color="text-green-600"
            subtitle={`${stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}% of total`}
          />
          <StatCard
            icon={UserX}
            title="Pending RSVP"
            value={stats.pending}
            color="text-orange-600"
            subtitle={`${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total`}
          />
          <StatCard
            icon={QrCode}
            title="Verified at Event"
            value={stats.verified}
            color="text-purple-600"
            subtitle={`${stats.confirmed > 0 ? Math.round((stats.verified / stats.confirmed) * 100) : 0}% of confirmed`}
          />
        </div>

        {stats.total > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* RSVP Status Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">RSVP Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Verification Status Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={verificationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Guests by Tag */}
        {stats.byTag.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <Tag className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Guests by Tag</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byTag}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.total === 0 && (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Guests Yet</h3>
            <p className="text-gray-600 mb-6">Start by adding guests to your event</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Guest
            </button>
          </div>
        )}
      </div>
    </>
  );
}
