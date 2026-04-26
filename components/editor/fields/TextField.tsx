import React from 'react';
import { useField } from './FieldContext';

export const TextField: React.FC = () => {
  const { field, form } = useField();
  const { register } = form;
  
  return (
    <input
      type={field.type}
      id={field.name}
      className="formfield"
      {...register(field.name)}
    />
  );
};

export default TextField;
