'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { Spinner } from '@/components/ui/spinner';
import { Users, UserCheck, UserX, QrCode, Tag, TrendingUp, UserPlus, Activity, CheckCircle, Armchair, DollarSign, Calendar, Image as ImageIcon, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Guest {
  _id: string;
  name: string;
  rsvpStatus: boolean;
  isUsed: boolean;
  tags: any[];
  plusOneAllowed: boolean;
  plusOneName?: string;
  plusOnePhone?: string;
  plusOneRsvp?: boolean;
}

interface Stats {
  total: number;
  confirmed: number;
  notConfirmed: number;
  verified: number;
  totalPlusOnes: number;
  confirmedPlusOnes: number;
  declinedPlusOnes: number;
  totalAttendees: number;
  byTag: { name: string; count: number }[];
}

export default function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couples, setCouples] = useState<any[]>([]);

  // Additional feature data
  const [seatingGuests, setSeatingGuests] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);

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

  const fetchData = useCallback(async () => {
    if (!token) return;
    if (isAdmin && !currentCoupleId) {
      setGuests([]);
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const apiParams = isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {};
      const [guestsRes, tagsRes, seatingRes, budgetRes, eventsRes, photosRes, timelineRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/guests`, {
          headers: { Authorization: `Bearer ${token}` },
          params: apiParams
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags`, {
          headers: { Authorization: `Bearer ${token}` },
          params: apiParams
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/seating`, {
          headers: { Authorization: `Bearer ${token}` },
          params: apiParams
        }).catch(() => ({ data: [] })),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget`, {
          headers: { Authorization: `Bearer ${token}` },
          params: apiParams
        }).catch(() => ({ data: { items: [], totalBudget: 0 } })),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
          params: apiParams
        }).catch(() => ({ data: [] })),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/photos`, {
          headers: { Authorization: `Bearer ${token}` },
          params: apiParams
        }).catch(() => ({ data: [] })),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_LINK}/api/timeline`, {
          headers: { Authorization: `Bearer ${token}` },
          params: apiParams
        }).catch(() => ({ data: [] }))
      ]);

      setGuests(guestsRes.data);
      setTags(tagsRes.data);
      setSeatingGuests(seatingRes.data);
      setBudgetItems(budgetRes.data.items || budgetRes.data);
      setEvents(eventsRes.data);
      setPhotos(photosRes.data);
      setTimelineItems(timelineRes.data);
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

  // Base counts
  const invitedGuests = guests.length; // Just the primary invited guests
  const totalPlusOnesAllowed = guests.filter(g => g.plusOneAllowed).length; // How many guests can bring plus ones
  const totalCapacity = invitedGuests + totalPlusOnesAllowed; // Total possible attendees (guests + their plus ones)

  // RSVP counts for primary guests
  const confirmedGuests = guests.filter(g => g.rsvpStatus).length;
  const notConfirmedGuests = guests.filter(g => !g.rsvpStatus).length;

  // Plus one RSVP counts (regardless of whether plusOneName is filled)
  const confirmedPlusOnes = guests.filter(g => g.plusOneAllowed && g.plusOneRsvp === true).length;
  const declinedPlusOnes = guests.filter(g => g.plusOneAllowed && g.plusOneRsvp === false).length;
  const pendingPlusOnes = guests.filter(g => g.plusOneAllowed && (g.plusOneRsvp === undefined || g.plusOneRsvp === null)).length;

  // Total expected attendees
  const totalAttendees = confirmedGuests + confirmedPlusOnes;

  const stats: Stats = {
    total: totalCapacity, // Total capacity (invited guests + plus ones allowed)
    confirmed: confirmedGuests,
    notConfirmed: notConfirmedGuests,
    verified: guests.filter(g => g.isUsed).length,
    totalPlusOnes: totalPlusOnesAllowed,
    confirmedPlusOnes,
    declinedPlusOnes,
    totalAttendees,
    byTag: tags.map(tag => ({
      name: tag.name,
      count: tag.users?.length || 0
    }))
  };

  // Calculate stats for additional features
  const seatedGuests = seatingGuests.filter((g: any) => g.tableNumber && g.seatNumber).length;
  const seatingCompletion = seatingGuests.length > 0
    ? Math.round((seatedGuests / seatingGuests.length) * 100)
    : 0;

  const totalBudget = budgetItems.reduce((sum: number, item: any) => sum + (item.estimatedCost || 0), 0);
  const totalSpent = budgetItems.reduce((sum: number, item: any) => sum + (item.actualCost || 0), 0);
  const budgetRemaining = totalBudget - totalSpent;
  const budgetPaidItems = budgetItems.filter((item: any) => item.paid).length;

  const totalEvents = events.length;
  const mainEvent = events.find((e: any) => e.isMainEvent);

  const totalPhotos = photos.length;
  const featuredPhotos = photos.filter((p: any) => p.featured).length;

  const totalTimelineItems = timelineItems.length;

  const pieData = [
    { name: 'Confirmed', value: stats.confirmed, color: '#10b981' },
    { name: 'Pending', value: stats.notConfirmed, color: '#f59e0b' }
  ];

  // Plus One Breakdown Data
  const plusOneBreakdownData = [
    { name: 'Confirmed Plus Ones', value: stats.confirmedPlusOnes, color: '#10b981' },
    { name: 'Declined Plus Ones', value: stats.declinedPlusOnes, color: '#ef4444' },
    { name: 'Pending Plus Ones', value: pendingPlusOnes, color: '#f59e0b' },
    { name: 'No Plus One', value: invitedGuests - totalPlusOnesAllowed, color: '#94a3b8' }
  ].filter(item => item.value > 0);

  // Attendance Flow Data
  const attendanceFlowData = [
    { name: 'Total Invited', count: stats.total, fill: '#3b82f6' },
    { name: 'Confirmed', count: stats.confirmed, fill: '#10b981' },
    { name: 'With Plus Ones', count: stats.confirmedPlusOnes, fill: '#8b5cf6' },
    { name: 'Expected Total', count: stats.totalAttendees, fill: '#14b8a6' },
    { name: 'Verified', count: stats.verified, fill: '#f59e0b' }
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
            title="Total Capacity"
            value={stats.total}
            color="text-blue-600"
            subtitle={`${invitedGuests} guests + ${totalPlusOnesAllowed} plus ones`}
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
            value={stats.notConfirmed}
            color="text-orange-600"
            subtitle={`${stats.total > 0 ? Math.round((stats.notConfirmed / stats.total) * 100) : 0}% of total`}
          />
          <StatCard
            icon={QrCode}
            title="Verified at Event"
            value={stats.verified}
            color="text-purple-600"
            subtitle={`${stats.confirmed > 0 ? Math.round((stats.verified / stats.confirmed) * 100) : 0}% of confirmed`}
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Invited Guests"
            value={invitedGuests}
            color="text-cyan-600"
            subtitle={`Primary invitations sent`}
          />
          <StatCard
            icon={UserPlus}
            title="Plus Ones"
            value={totalPlusOnesAllowed}
            color="text-indigo-600"
            subtitle={`${stats.confirmedPlusOnes} confirmed, ${declinedPlusOnes} declined`}
          />
          <StatCard
            icon={TrendingUp}
            title="Expected Attendees"
            value={stats.totalAttendees}
            color="text-teal-600"
            subtitle={`${stats.confirmed} guests + ${stats.confirmedPlusOnes} plus ones`}
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

        {/* Plus One Breakdown and Attendance Flow */}
        {stats.total > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Plus One Breakdown Chart */}
            {plusOneBreakdownData.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={plusOneBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: any) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {plusOneBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Attendance Flow Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Flow</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {attendanceFlowData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Wedding Planning Features Stats */}
        {(seatingGuests.length > 0 || budgetItems.length > 0 || events.length > 0 || photos.length > 0 || timelineItems.length > 0) && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Planning Overview</h2>
              <p className="text-gray-600">Track progress across all wedding planning features</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {seatingGuests.length > 0 && (
                <StatCard
                  icon={Armchair}
                  title="Seating"
                  value={`${seatedGuests}/${seatingGuests.length}`}
                  color="text-pink-600"
                  subtitle={`${seatingCompletion}% seated`}
                />
              )}
              {budgetItems.length > 0 && (
                <StatCard
                  icon={DollarSign}
                  title="Budget"
                  value={`₦${totalSpent.toLocaleString()}`}
                  color="text-green-600"
                  subtitle={`₦${budgetRemaining.toLocaleString()} remaining`}
                />
              )}
              {events.length > 0 && (
                <StatCard
                  icon={Calendar}
                  title="Events"
                  value={totalEvents}
                  color="text-blue-600"
                  subtitle={mainEvent ? `Main: ${mainEvent.eventName}` : `${totalEvents} event${totalEvents !== 1 ? 's' : ''}`}
                />
              )}
              {photos.length > 0 && (
                <StatCard
                  icon={ImageIcon}
                  title="Photos"
                  value={totalPhotos}
                  color="text-purple-600"
                  subtitle={`${featuredPhotos} featured`}
                />
              )}
              {timelineItems.length > 0 && (
                <StatCard
                  icon={Clock}
                  title="Timeline"
                  value={totalTimelineItems}
                  color="text-orange-600"
                  subtitle={`${totalTimelineItems} item${totalTimelineItems !== 1 ? 's' : ''} planned`}
                />
              )}
            </div>
          </>
        )}

        {/* Guests by Tag */}
        {stats.byTag.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
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
