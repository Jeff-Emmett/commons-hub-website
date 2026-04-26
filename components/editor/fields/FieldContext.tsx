import React, { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FieldDef, FormValues } from '../FormTypes';
import { TableConfig } from '@/lib/types/tablesConfigTypes';

// Define the context type
export interface FieldContextType {
  field: FieldDef;
  form: UseFormReturn<FormValues>;
  mergedConfigs: Record<string, TableConfig>;
}

// Create the context with a default value
const FieldContext = createContext<FieldContextType | undefined>(undefined);

// Provider component
export const FieldProvider: React.FC<FieldContextType & { children: React.ReactNode }> = ({ 
  field, 
  form, 
  mergedConfigs, 
  children 
}) => {
  return (
    <FieldContext.Provider value={{ field, form, mergedConfigs }}>
      {children}
    </FieldContext.Provider>
  );
};

// Custom hook to use the field context
export const useField = (): FieldContextType => {
  const context = useContext(FieldContext);
  if (context === undefined) {
    throw new Error('useField must be used within a FieldProvider');
  }
  return context;
};
