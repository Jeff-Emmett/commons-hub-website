import React from 'react';
import { useField } from './FieldContext';

export const NumberField: React.FC = () => {
  const { field, form } = useField();
  const { register, setValue } = form;
  
  return (
    <input
      type="number"
      id={field.name}
      className="formfield"
      {...register(field.name, {
        valueAsNumber: true, // This is the key fix - convert string to number
        onChange: (e) => {
          // Handle empty string case by setting to undefined
          if (e.target.value === '') {
            setValue(field.name, undefined);
          }
        }
      })}
    />
  );
};

export default NumberField;
