'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dataService } from '@/lib/services/DataService';
import DynamicForm from './DynamicForm';
import { FormValues } from './FormTypes';
import { TableConfig } from '@/lib/types/tablesConfigTypes';
import { useTableConfig } from '@/lib/contexts/TableConfigContext';
import { Tables } from '@/lib/services/DataTypes';

interface EditorClientProps {
  configs?: Record<string, TableConfig>;
  tableName: keyof Tables;
  itemId?: string;
  initialValues?: Record<string, unknown>; // Initial values for new items
  onSaveSuccess?: () => void; // Callback when save is successful
  onCancel?: () => void; // Callback when editing is cancelled
  noForm?: boolean; // Pass to DynamicForm to avoid nested forms
}

export default function EditorClient({ 
  configs,
  tableName, 
  itemId, 
  initialValues: propInitialValues,
  onSaveSuccess,
  onCancel,
  noForm = false
}: EditorClientProps) {
  const [item, setItem] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Get configs from context as fallback
  const contextConfigs = useTableConfig();
  
  // Use props configs if available, otherwise fall back to context configs
  const mergedConfigs = configs && Object.keys(configs).length > 0 ? configs : contextConfigs;
  
  // Validate that the table is allowed to be edited
  const tableConfig = mergedConfigs[tableName];
  const isValidTable = tableConfig && tableConfig.editable;
  
  const isNewItem = !itemId;
  
  useEffect(() => {
    // Redirect if invalid table
    if (!isValidTable) {
      router.push('/admin/unauthorized');
      return;
    }
    
    async function fetchItemData() {
      if (isNewItem) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await dataService.getById(tableName, itemId as string);
        if (data) {
          setItem(data);
        } else {
          setError('Item not found');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Error fetching item: ${errorMessage}`);
        console.error(error);
      }
      
      setLoading(false);
    }
    
    fetchItemData();
  }, [tableName, itemId, isValidTable, isNewItem, router]);
  
  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    
    try {
      // Make sure to include initialValues for new items (especially foreign keys)
      // This is critical for related items where the foreign key might not be in the form
      const dataToSave = isNewItem && propInitialValues
        ? { ...propInitialValues, ...values } // Merge initialValues with form values
        : values;
      
      // Filter out many-to-many relationship fields before sending to the API
      // These fields don't exist as actual columns in the database table
      const formFields = generateFormFields();
      const filteredData = Object.fromEntries(
        Object.entries(dataToSave).filter(([key, ]) => {
          const field = formFields.find(f => f.name === key);
          return field?.type !== 'relation_m-m';
        })
      );
      
      console.log('Submitting filtered data:', filteredData);
      
      if (isNewItem) {
        await dataService.create(tableName, filteredData as Record<string, unknown>);
      } else {
        await dataService.update(tableName, itemId as string, filteredData as Record<string, unknown>);
      }
      
      // Clear any previous errors
      setError(null);
      
      // Call the success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error saving: ${errorMessage}`);
      console.error(error);
    }
    
    setSaving(false);
  };
  
  // Get form fields from the table config
  const generateFormFields = () => {
    // All tables in our config have formFields defined
    return tableConfig?.formFields || [];
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const formFields = generateFormFields();
  
  // Merge any provided initialValues with the item data (for existing items)
  // or use them directly for new items
  const mergedInitialValues = isNewItem
    ? (propInitialValues || {})
    : (item || {});
    
  return (
    <div className="bg-white overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <DynamicForm
          configs={mergedConfigs}
          fields={formFields}
          initialValues={mergedInitialValues}
          onSubmit={handleSubmit}
          submitLabel={isNewItem ? 'Create' : 'Update'}
          isSubmitting={saving}
          noForm={noForm}
          cancelButton={onCancel ? {
            onClick: onCancel,
            disabled: saving
          } : undefined}
        />
      </div>
    </div>
  );
}
