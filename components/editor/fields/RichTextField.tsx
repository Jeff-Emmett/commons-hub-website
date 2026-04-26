import React from 'react';
import { useField } from './FieldContext';
import { Controller } from 'react-hook-form';
import dynamic from 'next/dynamic';


// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/admin/RichtextEditor2'), { ssr: false });

export const RichTextField: React.FC = () => {
  const { field, form } = useField();
  
  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: { onChange, value } }) => (
        <RichTextEditor
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
        />
      )}
    />
  );
};

export default RichTextField;
