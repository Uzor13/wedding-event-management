'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import NavBar from '@/components/ui/navbar';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users, Plus, Edit, Trash2, Mail, User, Key,
  Calendar, AlertCircle, Copy, Check, Eye, EyeOff
} from 'lucide-react';

interface Couple {
  _id: string;
  name: string;
  email?: string;
  username: string;
  eventTitle?: string;
  createdAt: string;
}

interface CoupleCredentials {
  username: string;
  password: string;
}

export default function CouplesManagement() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [selectedCouple, setSelectedCouple] = useState<Couple | null>(null);
  const [newCoupleCredentials, setNewCoupleCredentials] = useState<CoupleCredentials | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const router = useRouter();
  const { token, isAdmin } = useAuth();

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchCouples();
  }, [token, isAdmin, router]);

  const fetchCouples = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/couples`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCouples(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        toast.error('Failed to load couples');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/couples`,
        { name: formData.name, email: formData.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewCoupleCredentials(response.data.credentials);
      setShowCredentialsDialog(true);
      setShowAddDialog(false);
      await fetchCouples();
      toast.success('Couple added successfully!');
      setFormData({ name: '', email: '', password: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add couple');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouple) return;

    setSubmitting(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/couples/${selectedCouple._id}`,
        {
          name: formData.name,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {})
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowEditDialog(false);
      await fetchCouples();
      toast.success('Couple updated successfully!');
      setFormData({ name: '', email: '', password: '' });
      setSelectedCouple(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update couple');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCouple = async () => {
    if (!selectedCouple) return;

    setSubmitting(true);

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/admin/couples/${selectedCouple._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowDeleteDialog(false);
      await fetchCouples();
      toast.success('Couple and all related data deleted successfully!');
      setSelectedCouple(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete couple');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (couple: Couple) => {
    setSelectedCouple(couple);
    setFormData({
      name: couple.name,
      email: couple.email || '',
      password: ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (couple: Couple) => {
    setSelectedCouple(couple);
    setShowDeleteDialog(true);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
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
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Couples Management</h1>
              </div>
              <p className="text-gray-600">Manage couples and their wedding events</p>
            </div>
            <button
              onClick={() => {
                setFormData({ name: '', email: '', password: '' });
                setShowAddDialog(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Couple
            </button>
          </div>
        </div>

        {couples.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {couples.map((couple) => (
              <div
                key={couple._id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{couple.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(couple.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {couple.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{couple.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="font-mono">{couple.username}</span>
                  </div>
                  {couple.eventTitle && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{couple.eventTitle}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditDialog(couple)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteDialog(couple)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Couples Yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first couple</p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Couple
            </button>
          </div>
        )}

        {/* Add Couple Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Couple</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCouple} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couple Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John & Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Key className="inline w-4 h-4 mr-1" />
                  Login credentials will be automatically generated and shown after creation.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
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
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Couple
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Couple Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Couple</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCouple} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couple Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty to keep current password"
                />
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Update Couple
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Couple</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Warning: This action cannot be undone!</p>
                  <p className="text-sm text-red-700">
                    Deleting <strong>{selectedCouple?.name}</strong> will also delete:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                    <li>All guests associated with this couple</li>
                    <li>All tags and tag assignments</li>
                    <li>Event settings and configuration</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCouple}
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
                      Delete Couple
                    </>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Credentials Display Dialog */}
        <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Couple Created Successfully!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  <Check className="inline w-4 h-4 mr-1" />
                  The couple has been created with the following credentials:
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-3 font-medium">
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  Save these credentials! They won't be shown again.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">Username</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCoupleCredentials?.username || ''}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(newCoupleCredentials?.username || '', 'username')}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {copiedField === 'username' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">Password</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newCoupleCredentials?.password || ''}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(newCoupleCredentials?.password || '', 'password')}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {copiedField === 'password' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowCredentialsDialog(false);
                    setNewCoupleCredentials(null);
                    setShowPassword(false);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
