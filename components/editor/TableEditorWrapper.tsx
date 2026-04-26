'use client';

import { useState } from 'react';
import TableSearchServer from './TableSearchServer';
import TableSearchClient from './TableSearchClient';
import EditorClient from './EditorClient';
import { Tables } from '@/lib/services/DataTypes';
import { TableConfig } from '@/lib/types/tablesConfigTypes';

interface TableEditorWrapperProps {
  tableName: keyof Tables;
  configs: Record<string, TableConfig>;
}

export default function TableEditorWrapper({ tableName, configs }: TableEditorWrapperProps) {
  // Start with no selected item (which will show the create new form)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Use a refresh key to trigger table data refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle item selection from the table
  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  // Handle cancellation of editing - reset to create mode like Create New button
  const handleCancelEdit = () => {
    setSelectedItemId(null);
    setRefreshKey(prev => prev + 1);
  };

  // Handle successful save
  const handleSaveSuccess = () => {
    // Increment refresh key to trigger table data refresh
    setRefreshKey(prev => prev + 1);
    
    // If we were editing an existing item, keep it selected
    // If we were creating a new item, we'll stay in create mode
  };

  return (
    <div className="container mx-auto p-4 max-w-full">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Form section - on the left */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {selectedItemId ? `Edit ${tableName}` : `Create New ${tableName}`}
            </h2>
          </div>
          <EditorClient 
            configs={configs}
            key={selectedItemId || `new-item-${refreshKey}`}
            tableName={tableName} 
            itemId={selectedItemId || undefined}
            onSaveSuccess={handleSaveSuccess}
            onCancel={handleCancelEdit}
          />
        </div>
        
        {/* Table section - on the right */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {tableName} List
          </h2>
          {/* Conditionally render either server-side or client-side search based on config */}
          {configs[tableName as keyof typeof configs]?.searchMode === 'client' ? (
            <TableSearchClient 
              configs={configs}
              tableName={tableName} 
              onSelectItem={handleSelectItem}
              inlineMode={true}
              refreshKey={refreshKey}
            />
          ) : (
            <TableSearchServer 
              configs={configs}
              tableName={tableName} 
              onSelectItem={handleSelectItem}
              inlineMode={true}
              refreshKey={refreshKey}
            />
          )}
        </div>
      </div>
    </div>
  );
}
