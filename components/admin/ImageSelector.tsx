'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface ImageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  bucketName?: string;
}

export default function ImageSelector({ 
  value, 
  onChange,
  bucketName = 'website-images'
}: ImageSelectorProps) {
  const [images, setImages] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const supabase = createClient();
  
  // Load images from the website_images view
  useEffect(() => {
    async function loadImages() {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('website_images')
          .select('id, name');
          
        if (error) throw error;
        
        // Generate URLs for each image
        const imagesWithUrls = data.map(image => ({
          id: image.id || '',
          name: image.name || '',
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${image.name || ''}`
        }));
        
        setImages(imagesWithUrls);
      } catch (err) {
        console.error('Error loading images:', err);
        setError('Failed to load images. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadImages();
  }, [bucketName]);
  
  // Generate preview URL when value changes
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    
    async function loadImageUrl() {
      // First check if we already have this image in our loaded images
      const selectedImage = images.find(img => img.id === value);
      if (selectedImage) {
        setPreviewUrl(selectedImage.url);
        return;
      }
      
      // If not found in our loaded images, we need to fetch the filename from the database
      try {
        const { data, error } = await supabase
          .from('website_images')
          .select('name')
          .eq('id', value)
          .single();
          
        if (error || !data || !data.name) {
          console.error('Error fetching image details or image not found:', error);
          // Use a placeholder instead of trying to use the UUID as filename
          setPreviewUrl('/placeholder.jpg');
          return;
        }
        
        // Now we have the filename, we can construct the URL
        setPreviewUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${data.name}`);
      } catch (err) {
        console.error('Error loading image URL:', err);
        setPreviewUrl('/placeholder.jpg');
      }
    }
    
    loadImageUrl();
  }, [value, images, bucketName, supabase]);
  
  // Filter images based on search term
  const filteredImages = searchTerm 
    ? images.filter(img => img.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : images;
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Upload the file to Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) throw error;
      
      // // Get the file's metadata
      // const { data: fileData } = await supabase.storage
      //   .from(bucketName)
      //   .getPublicUrl(fileName);
      
      // Refresh the images list
      const { data: newImage, error: insertError } = await supabase
        .from('website_images')
        .select('id, name')
        .eq('name', fileName)
        .single();
        
      if (insertError) throw insertError;
      
      // Add the new image to the list
      const newImageWithUrl = {
        id: newImage.id || '',
        name: newImage.name || '',
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${newImage.name || ''}`
      };
      
      setImages(prev => [...prev, newImageWithUrl]);
      
      // Select the new image
      onChange(newImage.id || '');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle image selection
  const handleImageSelect = (imageId: string) => {
    onChange(imageId);
    setIsModalOpen(false);
  };
  
  return (
    <div className="w-full">
      {/* Preview area */}
      <div className="mb-2">
        {previewUrl ? (
          <div className="relative h-48 w-full border rounded-md overflow-hidden">
            <Image 
              src={previewUrl} 
              alt="Selected image"
              fill
              style={{ objectFit: 'contain' }}
              onError={() => setPreviewUrl('/placeholder.jpg')}
            />
          </div>
        ) : (
          <div className="h-48 w-full border rounded-md flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">No image selected</p>
          </div>
        )}
      </div>
      
      {/* Image actions */}
      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Select Image
        </button>
        
        {previewUrl && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Remove Image
          </button>
        )}
      </div>
      
      {/* Hidden input for the image ID */}
      
      {/* Selected image ID (hidden) */}
      <input type="hidden" value={value || ''} />
      
      {/* Image selection modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Select an Image
                    </h3>
                    
                    {/* Search and upload controls */}
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
                          <span>{isUploading ? `Uploading (${uploadProgress}%)` : 'Upload New Image'}</span>
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
                    
                    {/* Error message */}
                    {error && (
                      <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
                        {error}
                      </div>
                    )}
                    
                    {/* Image grid */}
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
                              className={`relative h-32 border rounded-md overflow-hidden cursor-pointer hover:opacity-90 ${value === image.id ? 'ring-2 ring-blue-500' : ''}`}
                              onClick={() => handleImageSelect(image.id)}
                            >
                              <Image
                                src={image.url}
                                alt={image.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                {image.name}
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
                </div>
              </div>
              
              {/* Modal footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
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
