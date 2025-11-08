'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { DollarSign, Plus, Trash2, Edit, Check, X } from 'lucide-react';

interface BudgetItem {
  _id: string;
  category: string;
  itemName: string;
  vendor?: string;
  estimatedCost: number;
  actualCost?: number;
  paid: boolean;
  notes?: string;
}

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Music/DJ', 'Attire', 'Flowers', 'Other'];

export default function BudgetTracker() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId } = useSettings();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    itemName: '',
    vendor: '',
    estimatedCost: '',
    actualCost: '',
    paid: false,
    notes: ''
  });
  const router = useRouter();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchItems();
  }, [token, currentCoupleId]);

  const fetchItems = async () => {
    if (!currentCoupleId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load budget items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget`,
        {
          ...formData,
          estimatedCost: parseFloat(formData.estimatedCost) || 0,
          actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
          coupleId: currentCoupleId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Budget item added!');
      setShowAddDialog(false);
      setFormData({
        category: '',
        itemName: '',
        vendor: '',
        estimatedCost: '',
        actualCost: '',
        paid: false,
        notes: ''
      });
      fetchItems();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget item?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Item deleted');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const togglePaid = async (item: BudgetItem) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget/${item._id}`,
        { ...item, paid: !item.paid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchItems();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const totalEstimated = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = items.reduce((sum, item) => sum + (item.actualCost || item.estimatedCost), 0);
  const totalPaid = items.filter(i => i.paid).reduce((sum, item) => sum + (item.actualCost || item.estimatedCost), 0);

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              Budget Tracker
            </h1>
            <p className="text-gray-600 mt-1">Manage your wedding expenses</p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Estimated Budget</p>
            <p className="text-2xl font-bold text-gray-900">N{totalEstimated.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Actual Spent</p>
            <p className="text-2xl font-bold text-indigo-600">N{totalActual.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-600">N{totalPaid.toLocaleString()}</p>
          </div>
        </div>

        {/* Budget Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Vendor</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Estimated</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actual</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Paid</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3 text-sm">{item.category}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.itemName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.vendor || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right">N{item.estimatedCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right">N{(item.actualCost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePaid(item)}
                      className={`p-1 rounded ${item.paid ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {item.paid ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Budget Item</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Item Name"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Vendor (Optional)"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Estimated Cost"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Add
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
