import React from 'react';
import { useField } from './FieldContext';
import { Controller } from 'react-hook-form';
import { ImageFieldDef } from '../FormTypes';
import ImageSelector from '@/components/admin/ImageSelector';

export const ImageField: React.FC = () => {
  const { field, form } = useField();
  const imageField = field as ImageFieldDef;
  
  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: { onChange, value } }) => {
        return (
          <div>
            <ImageSelector
              value={typeof value === 'string' ? value : ''}
              onChange={(newValue) => {
                // If empty string, set to undefined to exclude from form data
                if (newValue === '') {
                  onChange(null);
                } else {
                  onChange(newValue);
                }
              }}
              bucketName={imageField.bucketName}
            />
          </div>
        );
      }}
    />
  );
};

export default ImageField;
