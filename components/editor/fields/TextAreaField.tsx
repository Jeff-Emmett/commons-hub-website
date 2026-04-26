import React from 'react';
import { useField } from './FieldContext';
import { TextareaFieldDef } from '../FormTypes';

export const TextAreaField: React.FC = () => {
  const { field, form } = useField();
  const { register } = form;
  const textAreaField = field as TextareaFieldDef;
  
  return (
    <textarea
      id={field.name}
      className="formfield"
      rows={textAreaField.rows || 5}
      {...register(field.name)}
    />
  );
};

export default TextAreaField;
