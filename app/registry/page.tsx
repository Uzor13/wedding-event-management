'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { Gift, Plus, Trash2, Edit2, ExternalLink, Check } from 'lucide-react';

interface GiftItem {
  _id: string;
  itemName: string;
  category: string;
  description?: string;
  price?: number;
  quantity: number;
  quantityReceived: number;
  purchaseLink?: string;
  imageUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

const CATEGORIES = ['Kitchen', 'Bedroom', 'Living Room', 'Bathroom', 'Cash Gift', 'Honeymoon Fund', 'Other'];
const PRIORITIES = [
  { value: 'high', label: 'High Priority', color: 'text-red-600 bg-red-100' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'low', label: 'Low Priority', color: 'text-gray-600 bg-gray-100' }
];

export default function GiftRegistry() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId } = useSettings();
  const [items, setItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<GiftItem | null>(null);
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    description: '',
    price: '',
    quantity: '1',
    purchaseLink: '',
    imageUrl: '',
    priority: 'medium'
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
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/registry`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load registry items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
        quantity: parseInt(formData.quantity),
        quantityReceived: editingItem?.quantityReceived || 0,
        coupleId: currentCoupleId
      };

      if (editingItem) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/registry/${editingItem._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Item updated!');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/registry`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Item added!');
      }

      setShowDialog(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/registry/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Item deleted');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleEdit = (item: GiftItem) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      description: item.description || '',
      price: item.price?.toString() || '',
      quantity: item.quantity.toString(),
      purchaseLink: item.purchaseLink || '',
      imageUrl: item.imageUrl || '',
      priority: item.priority
    });
    setShowDialog(true);
  };

  const markAsReceived = async (item: GiftItem) => {
    if (item.quantityReceived >= item.quantity) {
      toast.info('All quantities already received');
      return;
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/registry/${item._id}`,
        {
          ...item,
          quantityReceived: item.quantityReceived + 1
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Marked as received!');
      fetchItems();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      category: '',
      description: '',
      price: '',
      quantity: '1',
      purchaseLink: '',
      imageUrl: '',
      priority: 'medium'
    });
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GiftItem[]>);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.quantityReceived, 0);
  const completionRate = totalItems > 0 ? Math.round((totalReceived / totalItems) * 100) : 0;

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Gift className="w-8 h-8" />
              Gift Registry
            </h1>
            <p className="text-gray-600 mt-1">Manage your wedding wishlist</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setShowDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Items Received</p>
            <p className="text-2xl font-bold text-green-600">{totalReceived}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Completion</p>
            <p className="text-2xl font-bold text-indigo-600">{completionRate}%</p>
          </div>
        </div>

        {/* Items by Category */}
        <div className="space-y-6">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
              No items yet. Start building your registry!
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="bg-white rounded-lg shadow">
                <div className="bg-indigo-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-indigo-900">{category}</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map((item) => {
                      const isComplete = item.quantityReceived >= item.quantity;
                      const priorityStyle = PRIORITIES.find((p) => p.value === item.priority);

                      return (
                        <div
                          key={item._id}
                          className={`border rounded-lg p-4 ${
                            isComplete ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'
                          }`}
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                            {isComplete && (
                              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          {item.price && (
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              N{item.price.toLocaleString()}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${priorityStyle?.color}`}
                            >
                              {priorityStyle?.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">
                              {item.quantityReceived} / {item.quantity}
                            </span>{' '}
                            received
                          </div>
                          <div className="flex gap-2">
                            {item.purchaseLink && (
                              <a
                                href={item.purchaseLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Buy
                              </a>
                            )}
                            <button
                              onClick={() => markAsReceived(item)}
                              disabled={isComplete}
                              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                            >
                              Received
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Edit Gift Item' : 'Add Gift Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (N)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Link</label>
                    <input
                      type="url"
                      value={formData.purchaseLink}
                      onChange={(e) => setFormData({ ...formData, purchaseLink: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDialog(false);
                      setEditingItem(null);
                      resetForm();
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
