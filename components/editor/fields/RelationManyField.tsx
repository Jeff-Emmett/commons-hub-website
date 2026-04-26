import React, { useState, useEffect } from 'react';
import { useField } from './FieldContext';
import { RelationManyFieldDef } from '../FormTypes';
import { dataService } from '@/lib/services/DataService';
import { Controller } from 'react-hook-form';

export const RelationManyField: React.FC = () => {
  const { field, form } = useField();
  const relationField = field as RelationManyFieldDef;
  
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Get the current value from the form
  const currentValue = form.watch(field.name);
  
  // Initialize selected items from value
  useEffect(() => {
    if (currentValue && Array.isArray(currentValue)) {
      setSelectedItems(currentValue);
    }
  }, [currentValue, field.name]);
  
  // Fetch options from the related table
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await dataService.getAll(relationField.tableName);
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
  }, [relationField.tableName, relationField.displayField, relationField.valueField]);
  
  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: { onChange } }) => {
        
        // Handle item selection/deselection
        const toggleItem = (itemValue: string) => {
          const newSelectedItems = selectedItems.includes(itemValue)
            ? selectedItems.filter(item => item !== itemValue)
            : [...selectedItems, itemValue];
          
          setSelectedItems(newSelectedItems);
          onChange(newSelectedItems);
        };
        
        return (
          <div className="border border-gray-300 rounded-md p-2">
            <div className="mb-2 font-medium">Selected {field.label}:</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedItems.length > 0 ? (
                selectedItems.map(itemId => {
                  const option = options.find(opt => opt.value === itemId);
                  return (
                    <div 
                      key={itemId} 
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center"
                    >
                      <span>{option?.label || itemId}</span>
                      <button 
                        type="button" 
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        onClick={() => toggleItem(itemId)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500">No items selected</div>
              )}
            </div>
            
            <div className="mb-2 font-medium">Available {field.label}:</div>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              {options.map(option => (
                <div 
                  key={option.value} 
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedItems.includes(option.value) ? 'bg-gray-50' : ''}`}
                  onClick={() => toggleItem(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
};

export default RelationManyField;
