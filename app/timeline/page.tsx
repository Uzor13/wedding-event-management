'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { Clock, Plus, Trash2, Edit2, GripVertical, ChevronUp, ChevronDown, X } from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  duration?: number;
  category: 'pre-ceremony' | 'ceremony' | 'reception' | 'other';
  order: number;
}

interface Couple {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: 'pre-ceremony', label: 'Pre-Ceremony' },
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'other', label: 'Other' }
];

export default function TimelineBuilder() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    duration: '',
    category: 'ceremony',
    order: 0
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
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/timeline`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCoupleId) {
      toast.error('Please select a couple first');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/timeline/${editingItem.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Timeline updated!');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/timeline`,
          {
            ...formData,
            duration: formData.duration ? parseInt(formData.duration) : undefined,
            order: items.length,
            coupleId: currentCoupleId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Timeline item added!');
      }

      setShowAddDialog(false);
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        time: '',
        duration: '',
        category: 'ceremony',
        order: 0
      });
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this timeline item?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/timeline/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Item deleted');
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleEdit = (item: TimelineItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      time: item.time,
      duration: item.duration?.toString() || '',
      category: item.category,
      order: item.order
    });
    setShowAddDialog(true);
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

    newItems.forEach((item, idx) => {
      item.order = idx;
    });

    setItems(newItems);

    try {
      await Promise.all(
        newItems.map((item) =>
          axios.put(
            `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/timeline/${item.id}`,
            { ...item },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reorder items');
      fetchItems();
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-5xl">
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
              <Clock className="w-8 h-8" />
              Event Timeline
            </h1>
            <p className="text-gray-600 mt-1">Plan your day-of schedule</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                title: '',
                description: '',
                time: '',
                duration: '',
                category: 'ceremony',
                order: 0
              });
              setShowAddDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            disabled={!currentCoupleId}
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Timeline by Category */}
        <div className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.value} className="bg-white rounded-lg shadow-sm">
              <div className="bg-indigo-50 px-4 py-2 border-b">
                <h3 className="font-semibold text-indigo-900">{cat.label}</h3>
              </div>
              <div className="p-4 space-y-2">
                {groupedItems[cat.value]?.length > 0 ? (
                  groupedItems[cat.value].map((item, index) => {
                    const categoryItems = groupedItems[cat.value];
                    const actualIndex = items.findIndex((i) => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveItem(actualIndex, 'up')}
                            disabled={actualIndex === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveItem(actualIndex, 'down')}
                            disabled={actualIndex === items.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-indigo-600">{item.time}</span>
                            <span className="font-medium">{item.title}</span>
                            {item.duration && (
                              <span className="text-sm text-gray-500">({item.duration} min)</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-4">No items in this category</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'Edit Timeline Item' : 'Add Timeline Item'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDialog(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    {editingItem ? 'Update' : 'Add'}
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
