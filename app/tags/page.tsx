'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import {
  Tag as TagIcon, Plus, Edit, Trash2, Users,
  AlertCircle, User, X
} from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  phoneNumber: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  users: Guest[];
  createdAt: string;
}

export default function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGuestsDialog, setShowGuestsDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [couples, setCouples] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6'
  });

  const router = useRouter();
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId, setSelectedCoupleId } = useSettings();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

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
          setSelectedCoupleId(response.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCouples();
  }, [isAdmin, token, selectedCoupleId, setSelectedCoupleId, router]);

  useEffect(() => {
    fetchTags();
  }, [token, currentCoupleId, isAdmin]);

  const fetchTags = async () => {
    if (!token) return;

    if (isAdmin && !currentCoupleId) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }
      );
      setTags(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        toast.error('Failed to load tags');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags`,
        {
          name: formData.name,
          color: formData.color,
          ...(isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {})
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowAddDialog(false);
      await fetchTags();
      toast.success('Tag created successfully!');
      setFormData({ name: '', color: '#3b82f6' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTag) return;

    setSubmitting(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags/${selectedTag.id}`,
        { name: formData.name, color: formData.color },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }
      );

      setShowEditDialog(false);
      await fetchTags();
      toast.success('Tag updated successfully!');
      setFormData({ name: '', color: '#3b82f6' });
      setSelectedTag(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    setSubmitting(true);

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/tags/${selectedTag.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin && currentCoupleId ? { coupleId: currentCoupleId } : {}
        }
      );

      setShowDeleteDialog(false);
      await fetchTags();
      toast.success('Tag deleted successfully!');
      setSelectedTag(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete tag');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || '#3b82f6'
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setShowDeleteDialog(true);
  };

  const openGuestsDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setShowGuestsDialog(true);
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
                <TagIcon className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Tag Management</h1>
              </div>
              <p className="text-gray-600">Organize guests with custom tags and categories</p>
            </div>
            {(!isAdmin || currentCoupleId) && (
              <button
                onClick={() => {
                  setFormData({ name: '', color: '#3b82f6' });
                  setShowAddDialog(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Create Tag
              </button>
            )}
          </div>
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

        {(!isAdmin || currentCoupleId) ? (
          tags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tags.filter(tag => tag != null).map((tag, index) => {
                const tagColor = tag?.color || '#6366f1';
                return (
                  <div
                    key={tag.id || `tag-item-${index}`}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: tagColor + '20' }}
                        >
                          <TagIcon
                            className="w-6 h-6"
                            style={{ color: tagColor }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{tag.name}</h3>
                          <p className="text-sm text-gray-500">
                            {tag.users?.length || 0} {tag.users?.length === 1 ? 'guest' : 'guests'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="flex-1 h-3 rounded-full"
                        style={{ backgroundColor: tagColor }}
                      />
                      <span className="text-xs font-mono text-gray-500">{tagColor}</span>
                    </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openGuestsDialog(tag)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                    >
                      <Users className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openEditDialog(tag)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(tag)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
              <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tags Yet</h3>
              <p className="text-gray-600 mb-6">Create your first tag to organize guests</p>
              <button
                onClick={() => {
                  setFormData({ name: '', color: '#3b82f6' });
                  setShowAddDialog(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Tag
              </button>
            </div>
          )
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Couple Selected</h3>
            <p className="text-gray-600">Please select a couple to manage their tags</p>
          </div>
        )}

        {/* Add Tag Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., VIP, Family, Friends"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Color *
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer"
                    style={{ backgroundColor: formData.color }}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <HexColorPicker
                    color={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                </div>
              </div>

              <div
                className="p-4 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: formData.color + '20' }}
              >
                <TagIcon style={{ color: formData.color }} className="w-5 h-5" />
                <span className="font-medium" style={{ color: formData.color }}>
                  {formData.name || 'Tag Preview'}
                </span>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Tag
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Tag Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name *
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
                  Tag Color *
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer"
                    style={{ backgroundColor: formData.color }}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <HexColorPicker
                    color={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                </div>
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
                      Update Tag
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
              <DialogTitle>Delete Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Are you sure?</p>
                  <p className="text-sm text-red-700">
                    Deleting <strong>{selectedTag?.name}</strong> will remove it from all {selectedTag?.users?.length || 0} associated guests.
                    This action cannot be undone.
                  </p>
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
                  onClick={handleDeleteTag}
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
                      Delete Tag
                    </>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Guests Dialog */}
        <Dialog open={showGuestsDialog} onOpenChange={setShowGuestsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: selectedTag?.color + '20' }}
                  >
                    <TagIcon className="w-5 h-5" style={{ color: selectedTag?.color }} />
                  </div>
                  {selectedTag?.name}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTag?.users && selectedTag.users.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedTag.users.length} {selectedTag.users.length === 1 ? 'guest' : 'guests'} in this tag
                  </p>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {selectedTag.users.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{guest.name}</p>
                          <p className="text-sm text-gray-600">{guest.phoneNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No guests in this tag yet</p>
                  <p className="text-sm text-gray-500 mt-1">Assign guests from the guest list</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowGuestsDialog(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
