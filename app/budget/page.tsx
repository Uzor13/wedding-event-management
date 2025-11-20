'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { DollarSign, Plus, Trash2, Edit, Check, X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetItem {
  id: string;
  category: string;
  itemName: string;
  vendor?: string;
  estimatedCost: number;
  actualCost?: number;
  paid: boolean;
  notes?: string;
}

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Music/DJ', 'Attire', 'Flowers', 'Other'];

interface Couple {
  id: string;
  name: string;
}

export default function BudgetTracker() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<BudgetItem | null>(null);
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

  const fetchItems = async () => {
    if (!currentCoupleId) {
      setLoading(false);
      return;
    }

    try {
      const [budgetRes, settingsRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: isAdmin ? { coupleId: currentCoupleId } : {}
          }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
          }
        ).catch(() => ({ data: {} }))
      ]);

      setItems(budgetRes.data);
      setTotalBudget(settingsRes.data.totalBudget || 0);
      setBudgetInput(settingsRes.data.totalBudget?.toString() || '');
    } catch (error) {
      toast.error('Failed to load budget items');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTotalBudget = async () => {
    const budget = parseFloat(budgetInput);
    if (isNaN(budget) || budget < 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings`,
        { totalBudget: budget },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }
      );
      setTotalBudget(budget);
      setIsEditingBudget(false);
      toast.success('Total budget updated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update budget');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCoupleId) {
      toast.error('Please select a couple first');
      return;
    }

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add item');
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
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget/${item.id}`,
        { ...item, paid: !item.paid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(item.paid ? 'Marked as unpaid' : 'Marked as paid');
      fetchItems();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const startEdit = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditFormData({ ...item });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditFormData(null);
  };

  const handleUpdateItem = async () => {
    if (!editFormData) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/budget/${editFormData.id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Budget item updated!');
      setEditingItemId(null);
      setEditFormData(null);
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const totalEstimated = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = items.reduce((sum, item) => sum + (item.actualCost || item.estimatedCost), 0);
  const totalPaid = items.filter(i => i.paid).reduce((sum, item) => sum + (item.actualCost || item.estimatedCost), 0);
  const balance = totalBudget - totalPaid;
  const isOverBudget = totalPaid > totalBudget && totalBudget > 0;
  const budgetPercentage = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

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
              <DollarSign className="w-8 h-8" />
              Budget Tracker
            </h1>
            <p className="text-gray-600 mt-1">Manage your wedding expenses</p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            disabled={!currentCoupleId}
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Total Budget Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg shadow-lg mb-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-indigo-100 mb-1">Total Wedding Budget</p>
              {isEditingBudget ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">₦</span>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="text-2xl font-bold bg-white/20 border border-white/30 rounded px-3 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Enter budget"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTotalBudget}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingBudget(false);
                      setBudgetInput(totalBudget.toString());
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold">
                    {totalBudget > 0 ? `₦${totalBudget.toLocaleString()}` : 'Not Set'}
                  </p>
                  <button
                    onClick={() => setIsEditingBudget(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {totalBudget > 0 && (
              <div className="text-right">
                <p className="text-sm text-indigo-100 mb-1">Budget Used</p>
                <p className="text-2xl font-bold">{budgetPercentage.toFixed(1)}%</p>
              </div>
            )}
          </div>
          {totalBudget > 0 && (
            <div className="mt-4">
              <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    budgetPercentage > 100
                      ? 'bg-red-500'
                      : budgetPercentage > 80
                      ? 'bg-yellow-400'
                      : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Estimated Cost
            </p>
            <p className="text-2xl font-bold text-gray-900">₦{totalEstimated.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Sum of all estimates</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Paid
            </p>
            <p className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Already paid</p>
          </div>
          <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${isOverBudget ? 'border-red-500' : 'border-indigo-500'}`}>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {isOverBudget ? 'Over Budget' : 'Balance'}
            </p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-indigo-600'}`}>
              ₦{Math.abs(balance).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {totalBudget > 0 ? (isOverBudget ? 'Amount over budget' : 'Remaining') : 'Set total budget'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              Unpaid
            </p>
            <p className="text-2xl font-bold text-orange-600">₦{(totalEstimated - totalPaid).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Still to pay</p>
          </div>
        </div>

        {/* Over Budget Alert */}
        {isOverBudget && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Over Budget Warning!</h3>
              <p className="text-sm text-red-700 mt-1">
                You've exceeded your total budget by ₦{Math.abs(balance).toLocaleString()}. Consider reviewing your expenses or adjusting your budget.
              </p>
            </div>
          </div>
        )}

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
              {items.map((item) => {
                const isEditing = editingItemId === item.id;
                return (
                  <tr key={item.id} className={isEditing ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <select
                          value={editFormData?.category || ''}
                          onChange={(e) => setEditFormData(editFormData ? { ...editFormData, category: e.target.value } : null)}
                          className="w-full px-2 py-1 border rounded"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        item.category
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData?.itemName || ''}
                          onChange={(e) => setEditFormData(editFormData ? { ...editFormData, itemName: e.target.value } : null)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      ) : (
                        item.itemName
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData?.vendor || ''}
                          onChange={(e) => setEditFormData(editFormData ? { ...editFormData, vendor: e.target.value } : null)}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Vendor"
                        />
                      ) : (
                        item.vendor || '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData?.estimatedCost || ''}
                          onChange={(e) => setEditFormData(editFormData ? { ...editFormData, estimatedCost: parseFloat(e.target.value) || 0 } : null)}
                          className="w-full px-2 py-1 border rounded text-right"
                        />
                      ) : (
                        `₦${item.estimatedCost.toLocaleString()}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData?.actualCost || ''}
                          onChange={(e) => setEditFormData(editFormData ? { ...editFormData, actualCost: parseFloat(e.target.value) || 0 } : null)}
                          className="w-full px-2 py-1 border rounded text-right"
                          placeholder="0"
                        />
                      ) : (
                        `₦${(item.actualCost || 0).toLocaleString()}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <span className="text-xs text-gray-500">Editing...</span>
                      ) : (
                        <button
                          onClick={() => togglePaid(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            item.paid
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {item.paid ? 'Paid' : 'Unpaid'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={handleUpdateItem}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Budget Item</h2>
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
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
