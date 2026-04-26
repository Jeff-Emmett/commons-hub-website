'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { TableConfig } from '@/lib/types/tablesConfigTypes';

// Create the context with a default empty object
const TableConfigContext = createContext<Record<string, TableConfig>>({});

// Provider component
export const TableConfigProvider: React.FC<{
  configs: Record<string, TableConfig>;
  children: ReactNode;
}> = ({ configs, children }) => {
  return (
    <TableConfigContext.Provider value={configs}>
      {children}
    </TableConfigContext.Provider>
  );
};

// Hook to use the context
export const useTableConfig = () => {
  const context = useContext(TableConfigContext);
  if (context === undefined) {
    console.warn('useTableConfig must be used within a TableConfigProvider');
    return {};
  }
  return context;
};
