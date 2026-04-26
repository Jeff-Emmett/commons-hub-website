import React, { useState, useEffect } from 'react';
import { useField } from './FieldContext';
import { RelationFieldDef } from '../FormTypes';
import { dataService } from '@/lib/services/DataService';

export const RelationField: React.FC = () => {
  const { field, form } = useField();
  const { register } = form;
  const relationField = field as RelationFieldDef;
  
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  
  // Fetch options from the related table
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const queryOptions = relationField.queryOptions || {};
        const response = await dataService.getAll(relationField.tableName, queryOptions);
        const valueField = relationField.valueField || 'id';
        
        // Map the data to options format
        if (response.data && Array.isArray(response.data)) {
          const mappedOptions = response.data.map((item: Record<string, unknown>) => ({
            value: String((item as Record<string, unknown>)[valueField]),
            label: String((item as Record<string, unknown>)[relationField.displayField] || (item as Record<string, unknown>)[valueField])
          }));
          
          setOptions(mappedOptions);
        } else {
          console.error(`Invalid data format for ${relationField.tableName}`);
          setOptions([]);
        }
      } catch (error) {
        console.error(`Error fetching options for ${relationField.tableName}:`, error);
        setOptions([]);
      }
    };

    fetchOptions();
  }, [relationField.tableName, relationField.displayField, relationField.valueField, relationField.queryOptions]);
  
  // Get the current value from the form
  const currentValue = form.getValues(field.name);
  
  // Set the selected option when options are loaded or currentValue changes
  useEffect(() => {
    if (currentValue && options.length > 0) {
      // Ensure the value is a string for comparison
      const valueStr = String(currentValue);
      
      // Check if the current value exists in the options
      const optionExists = options.some(opt => opt.value === valueStr);
      
      if (optionExists) {
        // Set the value in the form to ensure it's selected in the dropdown
        form.setValue(field.name, valueStr);
      }
    }
  }, [options, currentValue, field.name, form]);
  
  return (
    <select
      id={field.name}
      disabled={field.disabled}
      className="formfield"
      {...register(field.name, { setValueAs: (value) => value === '' ? undefined : value })}
    >
      <option value="">Select {field.label}</option>
      {options.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default RelationField;
