import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface ImageSelectorProps {
  value?: string;
  onChange: (fileName: string) => void;
  bucketName?: string;
}

interface StorageFile {
  name: string;
  url: string;
  mime_type: string | null;
  size: number | null;
  id: string | null;
  bucket_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_accessed_at: string | null;
}

/**
 * A component for selecting images from Supabase Storage
 */
export default function ImageSelector({
  value,
  onChange,
  bucketName = 'website-images'
}: ImageSelectorProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  
  // Generate URL for the selected image
  useEffect(() => {
    if (value) {
      // Use hardcoded project ID for simplicity, or get it from environment
      setSelectedImageUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${value}`);
    } else {
      setSelectedImageUrl('');
    }
  }, [value, bucketName]);

  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Fetch images from the website_images view
        const { data, error } = await supabase
          .from('website_images')
          .select('*');
          
        if (error) throw error;
        
        // Map the data to ensure required fields are not null
        const mappedFiles = (data || []).map(file => ({
          ...file,
          name: file.name || '',
          // Generate direct URL for each image
          url: file.name ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${file.name}` : ''
        }));
        setFiles(mappedFiles);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    }
    
    fetchImages();
  }, [bucketName]);
  
  return (
    <div className="image-selector">
      <div className="selected-image mb-4">
        <p className="font-medium mb-2">Selected Image:</p>
        {value ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-16 relative border rounded overflow-hidden">
              {selectedImageUrl && (
                <Image
                  src={selectedImageUrl}
                  alt={value}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <span className="text-sm">{value}</span>
            <button 
              onClick={() => onChange('')}
              className="text-red-500 text-sm"
            >
              Clear
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No image selected</p>
        )}
      </div>
      
      {loading ? (
        <p>Loading images...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <div 
              key={file.name}
              className={`cursor-pointer border rounded p-2 ${value === file.name ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => onChange(file.name)}
            >
              <div className="aspect-square relative mb-2">
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-xs truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{file.size ? Math.round(file.size / 1024) : 0} KB</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
