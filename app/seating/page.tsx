'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { Users, Edit2, X } from 'lucide-react';

interface Guest {
  _id: string;
  name: string;
  phoneNumber: string;
  tableNumber?: number;
  seatNumber?: number;
  plusOneAllowed: boolean;
  plusOneName?: string;
  rsvpStatus: boolean;
}

export default function SeatingPlanner() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId } = useSettings();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    seatNumber: ''
  });
  const router = useRouter();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchGuests();
  }, [token, currentCoupleId]);

  const fetchGuests = async () => {
    if (!currentCoupleId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/seating`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      setGuests(response.data);
    } catch (error) {
      toast.error('Failed to load seating data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingGuest) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/seating/${editingGuest._id}`,
        {
          tableNumber: formData.tableNumber ? parseInt(formData.tableNumber) : undefined,
          seatNumber: formData.seatNumber ? parseInt(formData.seatNumber) : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Seating updated!');
      setEditingGuest(null);
      setFormData({ tableNumber: '', seatNumber: '' });
      fetchGuests();
    } catch (error) {
      toast.error('Failed to update seating');
    }
  };

  const clearSeating = async (guest: Guest) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/seating/${guest._id}`,
        { tableNumber: undefined, seatNumber: undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Seating cleared');
      fetchGuests();
    } catch (error) {
      toast.error('Failed to clear seating');
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      tableNumber: guest.tableNumber?.toString() || '',
      seatNumber: guest.seatNumber?.toString() || ''
    });
  };

  // Group guests by table
  const groupedByTable = guests.reduce((acc, guest) => {
    if (guest.tableNumber) {
      if (!acc[guest.tableNumber]) acc[guest.tableNumber] = [];
      acc[guest.tableNumber].push(guest);
    }
    return acc;
  }, {} as Record<number, Guest[]>);

  const unassignedGuests = guests.filter((g) => !g.tableNumber);
  const tableNumbers = Object.keys(groupedByTable)
    .map(Number)
    .sort((a, b) => a - b);

  const totalAssigned = guests.filter((g) => g.tableNumber).length;
  const totalSeats = guests.length;

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Seating Planner
            </h1>
            <p className="text-gray-600 mt-1">Arrange guests at tables</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Assigned</p>
            <p className="text-2xl font-bold text-indigo-600">
              {totalAssigned} / {totalSeats}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Tables</p>
            <p className="text-2xl font-bold text-gray-900">{tableNumbers.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Assigned Guests</p>
            <p className="text-2xl font-bold text-green-600">{totalAssigned}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Unassigned</p>
            <p className="text-2xl font-bold text-yellow-600">{unassignedGuests.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Section */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Tables</h2>

            {tableNumbers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No tables assigned yet. Start by assigning guests to tables.
              </div>
            ) : (
              tableNumbers.map((tableNum) => (
                <div key={tableNum} className="bg-white rounded-lg shadow">
                  <div className="bg-indigo-50 px-4 py-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-indigo-900">Table {tableNum}</h3>
                    <span className="text-sm text-gray-600">
                      {groupedByTable[tableNum].length} guest{groupedByTable[tableNum].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {groupedByTable[tableNum]
                        .sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0))
                        .map((guest) => (
                          <div
                            key={guest._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{guest.name}</p>
                              <p className="text-sm text-gray-600">
                                {guest.seatNumber && `Seat ${guest.seatNumber}`}
                                {guest.plusOneAllowed && guest.plusOneName && (
                                  <span className="ml-2 text-indigo-600">
                                    + {guest.plusOneName}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(guest)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => clearSeating(guest)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Unassigned Guests Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-24">
              <div className="bg-yellow-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-yellow-900">
                  Unassigned Guests ({unassignedGuests.length})
                </h3>
              </div>
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {unassignedGuests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">All guests assigned!</p>
                ) : (
                  <div className="space-y-2">
                    {unassignedGuests.map((guest) => (
                      <div
                        key={guest._id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleEdit(guest)}
                      >
                        <p className="font-medium text-sm">{guest.name}</p>
                        {guest.plusOneAllowed && guest.plusOneName && (
                          <p className="text-xs text-indigo-600">+ {guest.plusOneName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        {editingGuest && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Assign Seating</h2>
              <p className="text-gray-600 mb-4">
                Guest: <span className="font-medium">{editingGuest.name}</span>
                {editingGuest.plusOneAllowed && editingGuest.plusOneName && (
                  <span className="text-indigo-600"> + {editingGuest.plusOneName}</span>
                )}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Table Number</label>
                  <input
                    type="number"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Seat Number (Optional)</label>
                  <input
                    type="number"
                    value={formData.seatNumber}
                    onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 1"
                    min="1"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGuest(null);
                      setFormData({ tableNumber: '', seatNumber: '' });
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Assign
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
