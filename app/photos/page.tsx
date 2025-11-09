'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';
import { toast } from 'sonner';
import { Image as ImageIcon, Plus, Trash2, Star, X } from 'lucide-react';

interface Photo {
  id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: 'pre-wedding' | 'ceremony' | 'reception' | 'other';
  featured: boolean;
  order: number;
}

const CATEGORIES = [
  { value: 'all', label: 'All Photos' },
  { value: 'pre-wedding', label: 'Pre-Wedding' },
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'other', label: 'Other' }
];

export default function PhotoGallery() {
  const { token, isAdmin, coupleId } = useAuth();
  const { selectedCoupleId } = useSettings();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: 'other',
    featured: false
  });
  const router = useRouter();
  const currentCoupleId = isAdmin ? selectedCoupleId : coupleId;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPhotos();
  }, [token, currentCoupleId]);

  const fetchPhotos = async () => {
    if (!currentCoupleId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/photos`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: isAdmin ? { coupleId: currentCoupleId } : {}
        }
      );
      setPhotos(response.data);
    } catch (error) {
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, imageUrl: base64 });
        toast.success('Image loaded! You can now add details and submit.');
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to process image');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      toast.error('Please provide an image');
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/photos`,
        {
          ...formData,
          coupleId: currentCoupleId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Photo added!');
      setShowDialog(false);
      resetForm();
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to add photo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/photos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Photo deleted');
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  const toggleFeatured = async (photo: Photo) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/photos/${photo.id}`,
        { ...photo, featured: !photo.featured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to update photo');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      category: 'other',
      featured: false
    });
  };

  const filteredPhotos =
    selectedCategory === 'all'
      ? photos
      : photos.filter((p) => p.category === selectedCategory);

  const featuredPhotos = filteredPhotos.filter((p) => p.featured);
  const regularPhotos = filteredPhotos.filter((p) => !p.featured);

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ImageIcon className="w-8 h-8" />
              Photo Gallery
            </h1>
            <p className="text-gray-600 mt-1">Capture your special moments</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Add Photo
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured Photos */}
        {featuredPhotos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              Featured Photos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group bg-white rounded-lg shadow-sm overflow-hidden border-2 border-yellow-400"
                >
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.title || 'Photo'}
                    className="w-full h-64 object-cover cursor-pointer"
                    onClick={() => setViewingPhoto(photo)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => toggleFeatured(photo)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      title="Remove from featured"
                    >
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                  {photo.title && (
                    <div className="p-3 bg-white">
                      <p className="font-medium text-gray-900">{photo.title}</p>
                      {photo.description && (
                        <p className="text-sm text-gray-600">{photo.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Photos */}
        <div>
          {featuredPhotos.length > 0 && (
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Photos</h2>
          )}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading photos...</div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
              No photos yet. Add your first photo to get started!
            </div>
          ) : regularPhotos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              All photos are featured in this category
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.title || 'Photo'}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => setViewingPhoto(photo)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => toggleFeatured(photo)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      title="Add to featured"
                    >
                      <Star className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                  {photo.title && (
                    <div className="p-2 bg-white">
                      <p className="text-sm font-medium text-gray-900 truncate">{photo.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Photo Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Photo</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Upload from Device</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {uploading ? 'Loading image...' : 'Choose an image file (max 5MB)'}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a URL to an image (from Imgur, Google Drive, etc.)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    rows={2}
                    placeholder="Optional"
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
                    {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Feature this photo</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDialog(false);
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
                    Add Photo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fullscreen View */}
        {viewingPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingPhoto(null)}
          >
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-6xl max-h-[90vh] flex flex-col items-center">
              <img
                src={viewingPhoto.imageUrl}
                alt={viewingPhoto.title || 'Photo'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              {(viewingPhoto.title || viewingPhoto.description) && (
                <div className="mt-4 text-center text-white">
                  {viewingPhoto.title && (
                    <h3 className="text-xl font-semibold mb-1">{viewingPhoto.title}</h3>
                  )}
                  {viewingPhoto.description && (
                    <p className="text-gray-300">{viewingPhoto.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
