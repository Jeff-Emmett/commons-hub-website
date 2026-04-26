import React from 'react';
import { useField } from './FieldContext';

export const BooleanField: React.FC = () => {
  const { field, form } = useField();
  const { register } = form;
  
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={field.name}
        disabled={field.disabled}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        {...register(field.name)}
      />
      <label htmlFor={field.name} className="ml-2 block text-sm text-gray-900">
        {field.label}
      </label>
    </div>
  );
};

export default BooleanField;
