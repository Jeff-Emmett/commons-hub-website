import React from 'react';
import { useField } from './FieldContext';

export const DateField: React.FC = () => {
  const { field, form } = useField();
  const { register } = form;
  
  return (
    <input
      type="date"
      id={field.name}
      disabled={field.disabled}
      className="formfield"
      {...register(field.name)}
    />
  );
};

export default DateField;
