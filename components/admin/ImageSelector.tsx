'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.commons-hub.at'
).replace(/\/$/, '');

interface ImageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  bucketName?: string;
}

interface DirectusFile {
  id: string;
  filename_download: string;
  type?: string | null;
}

function assetUrl(id: string): string {
  return `${ASSET_BASE}/assets/${id}`;
}

export default function ImageSelector({ value, onChange }: ImageSelectorProps) {
  const [images, setImages] = useState<DirectusFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadImages() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/files?filter[type][_starts_with]=image/&limit=500&sort=-uploaded_on');
        if (!res.ok) throw new Error(`Failed to load images (${res.status})`);
        const body = await res.json();
        setImages((body.data ?? []) as DirectusFile[]);
      } catch (err) {
        console.error('Error loading images:', err);
        setError('Failed to load images. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadImages();
  }, []);

  const previewUrl = value ? assetUrl(value) : null;

  const filteredImages = searchTerm
    ? images.filter((img) =>
        img.filename_download?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : images;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/files', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const body = await res.json();
      const created = body.data as DirectusFile;
      setImages((prev) => [created, ...prev]);
      onChange(created.id);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (imageId: string) => {
    onChange(imageId);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        {previewUrl ? (
          <div className="relative h-48 w-full border rounded-md overflow-hidden">
            <Image
              src={previewUrl}
              alt="Selected image"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div className="h-48 w-full border rounded-md flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">No image selected</p>
          </div>
        )}
      </div>

      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Select Image
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            Remove Image
          </button>
        )}
      </div>

      <input type="hidden" value={value || ''} />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select an Image</h3>
                <div className="flex justify-between mb-4">
                  <div className="w-1/2 pr-2">
                    <input
                      type="text"
                      placeholder="Search images..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-1/2 pl-2">
                    <label className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <span>{isUploading ? 'Uploading…' : 'Upload New Image'}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">{error}</div>
                )}

                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <p>Loading images...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredImages.length > 0 ? (
                      filteredImages.map((image) => (
                        <div
                          key={image.id}
                          className={`relative h-32 border rounded-md overflow-hidden cursor-pointer hover:opacity-90 ${
                            value === image.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => handleImageSelect(image.id)}
                        >
                          <Image
                            src={assetUrl(image.id)}
                            alt={image.filename_download}
                            fill
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg';
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                            {image.filename_download}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 flex justify-center items-center h-64">
                        <p>No images found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
