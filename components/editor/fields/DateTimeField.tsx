import React from 'react';
import { useField } from './FieldContext';

export const DateTimeField: React.FC = () => {
  const { field, form } = useField();
  const { register } = form;
  
  return (
    <input
      type="datetime-local"
      id={field.name}
      disabled={field.disabled}
      className="formfield"
      {...register(field.name)}
    />
  );
};

export default DateTimeField;
