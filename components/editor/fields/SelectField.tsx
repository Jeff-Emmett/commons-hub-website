import React from 'react';
import { useField } from './FieldContext';
import { SelectFieldDef } from '../FormTypes';

export const SelectField: React.FC = () => {
  const { field, form } = useField();
  const { register } = form;
  const selectField = field as SelectFieldDef;
  
  return (
    <select
      id={field.name}
      disabled={field.disabled}
      className="formfield"
      {...register(field.name, { setValueAs: (value) => value === '' ? undefined : value })}
    >
      <option value="">Select {field.label}</option>
      {selectField.options?.map((option: { value: string | number; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default SelectField;
