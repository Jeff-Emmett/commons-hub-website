import React, { useState, useEffect } from 'react';
import { useField } from './FieldContext';
import { RelationManyToManyFieldDef } from '../FormTypes';
import { dataService } from '@/lib/services/DataService';
import { Controller } from 'react-hook-form';
import { formatCellValue } from '@/lib/utils/formatCellValue';

export const ManyToManyField: React.FC = () => {
  const { field, form } = useField();
  const m2mField = field as RelationManyToManyFieldDef;
  
  const [options, setOptions] = useState<Array<{ value: string; label: string; data: unknown }>>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const formValues = form.getValues();
  // Keep the original type (number or string) for database operations
  const currentItemId = formValues.id || null;
  
  // Fetch options from the related table and current selections from the junction table
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all possible options from the related table
        const relatedResponse = await dataService.getAll(m2mField.relatedTable);
        
        // Map the data to options format
        let mappedOptions: Array<{ value: string; label: string; data: unknown }> = [];
        if (relatedResponse.data && Array.isArray(relatedResponse.data)) {
          mappedOptions = relatedResponse.data.map((item: Record<string, unknown>) => {
            // Use the actual ID field from the related table
            const valueField = 'id'; // Usually ID is the value field
            let label = '';
            
            // Create label from displayFields
            if (m2mField.displayFields && m2mField.displayFields.length > 0) {
              label = m2mField.displayFields
                .map(field => formatCellValue((item as Record<string, unknown>)[field]))
                .filter(Boolean)
                .join(' - ');
            } else {
              label = String((item as Record<string, unknown>)[valueField]);
            }
            
            return {
              value: String((item as Record<string, unknown>)[valueField]),
              label,
              data: item
            };
          });
          
          setOptions(mappedOptions);
        }
        
        // If we have a current item ID, fetch existing relationships
        if (currentItemId && (typeof currentItemId === 'string' || typeof currentItemId === 'number')) {
          try {
            const relationshipsResponse = await dataService.getManyToManyRelationships(
              m2mField.junctionTable,
              m2mField.foreignKey,
              currentItemId,
              m2mField.relatedKey
            );
            
            if (relationshipsResponse.data && Array.isArray(relationshipsResponse.data)) {
              // Extract the related IDs from the junction records
              const selectedIds = (relationshipsResponse.data as unknown as Array<Record<string, unknown>>).map((item) => {
                // The related item data is nested under the relatedKey
                const relatedItem = (item as Record<string, unknown>)[m2mField.relatedKey];
                // Ensure relatedItem is an object with an id property before accessing it
                return relatedItem && typeof relatedItem === 'object' && relatedItem !== null && 'id' in relatedItem
                  ? String((relatedItem as Record<string, unknown>).id)
                  : null;
              }).filter(Boolean) as string[];
              
              console.log('Selected related IDs:', selectedIds);
              setSelectedItems(selectedIds);
            } else {
              console.log('No junction data returned or not an array');
              setSelectedItems([]);
            }
          } catch (error) {
            console.error('Error fetching relationships:', error);
            setSelectedItems([]);
          }
        }
      } catch (error) {
        console.error(`Error fetching data for ${m2mField.relatedTable}:`, error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [m2mField.relatedTable, m2mField.junctionTable, m2mField.foreignKey, m2mField.relatedKey, m2mField.displayFields, currentItemId]);
  
  // Handle saving the many-to-many relationships
  const saveRelationships = async (selectedIds: string[]) => {
    // Check if currentItemId exists and is of the correct type
    if (!currentItemId || (typeof currentItemId !== 'string' && typeof currentItemId !== 'number')) return;
    
    try {
    
      // First, fetch all current relationships
      const currentRelations = await dataService.getManyToManyRelationships(
        m2mField.junctionTable,
        m2mField.foreignKey,
        currentItemId,
        m2mField.relatedKey
      );
      
      if (currentRelations.data && Array.isArray(currentRelations.data)) {
        // Extract the current related IDs
        const currentIds = (currentRelations.data as unknown as Array<Record<string, unknown>>).map(item => {
          const relatedItem = (item as Record<string, unknown>)[m2mField.relatedKey];
          // Ensure relatedItem is an object with an id property before accessing it
          return relatedItem && typeof relatedItem === 'object' && relatedItem !== null && 'id' in relatedItem
            ? String((relatedItem as Record<string, unknown>).id)
            : null;
        }).filter(Boolean) as string[];
        
        console.log('Current related IDs:', currentIds);
        console.log('Selected IDs to set:', selectedIds);
        
        // Find IDs to remove (in current but not in selected)
        const idsToRemove = currentIds.filter(id => !selectedIds.includes(id));
        console.log('IDs to remove:', idsToRemove);
        
        // Find IDs to add (in selected but not in current)
        const idsToAdd = selectedIds.filter(id => !currentIds.includes(id));
        console.log('IDs to add:', idsToAdd);
        
        // Remove relationships that are no longer selected
        for (const idToRemove of idsToRemove) {
          try {
            console.log(`Removing relationship: ${m2mField.foreignKey}=${currentItemId}, ${m2mField.relatedKey}=${idToRemove}`);
            await dataService.deleteByQuery(
              m2mField.junctionTable,
              m2mField.foreignKey,
              currentItemId,
              m2mField.relatedKey,
              idToRemove
            );
          } catch (error) {
            console.error(`Error removing relationship for ${idToRemove}:`, error);
          }
        }
        
        // Add new relationships
        for (const idToAdd of idsToAdd) {
          try {
            console.log(`Adding relationship: ${m2mField.foreignKey}=${currentItemId}, ${m2mField.relatedKey}=${idToAdd}`);
            // Create junction record with the specific foreign key and related key
            const newRelation = {
              [m2mField.foreignKey]: currentItemId,
              [m2mField.relatedKey]: idToAdd
            };
            await dataService.create(m2mField.junctionTable, newRelation);
          } catch (error) {
            console.error(`Error creating relationship for ${idToAdd}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error saving relationships for ${m2mField.junctionTable}:`, error);
    }
  };
  
  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: { onChange } }) => {
        // Handle item selection/deselection
        const toggleItem = (itemValue: string) => {
          const newSelectedItems = selectedItems.includes(itemValue)
            ? selectedItems.filter((item: string) => item !== itemValue)
            : [...selectedItems, itemValue];
          
          setSelectedItems(newSelectedItems);
          onChange(newSelectedItems);
          
          // If we have a current item ID, save the relationships immediately
          if (currentItemId && (typeof currentItemId === 'string' || typeof currentItemId === 'number')) {
            saveRelationships(newSelectedItems);
          }
        };
        
        if (isLoading) {
          return <div className="p-2">Loading relationships...</div>;
        }
        
        if (!currentItemId) {
          return (
            <div className="text-gray-500 italic p-4 border border-gray-200 rounded-md">
              Save this record first to manage relationships
            </div>
          );
        }
        
        return (
          <div className="border border-gray-300 rounded-md p-2">
            <div className="mb-2 font-medium">Selected {field.label}:</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedItems.length > 0 ? (
                selectedItems.map((itemId: string) => {
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
              {options.length > 0 ? (
                options.map((option: { value: string; label: string; data: unknown }) => (
                  <div 
                    key={option.value} 
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedItems.includes(option.value) ? 'bg-gray-50' : ''}`}
                    onClick={() => toggleItem(option.value)}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No options available</div>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default ManyToManyField;
