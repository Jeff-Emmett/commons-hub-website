'use client';

import { useState, useEffect } from 'react';
import TableClient from './TableClient';
import TableSearch from './TableSearch';
import { Tables } from '@/lib/services/DataTypes';
import { TableConfig } from '@/lib/types/tablesConfigTypes';

interface TableSearchClientProps {
  configs: Record<string, TableConfig>;
  tableName: keyof Tables;
  inlineMode?: boolean;
  onSelectItem?: (itemId: string) => void;
  refreshKey?: number;
}

export default function TableSearchClient({
  configs,
  tableName,
  inlineMode = false,
  onSelectItem,
  refreshKey = 0
}: TableSearchClientProps) {
  const [allItems, setAllItems] = useState<Record<string, unknown>[]>([]);
  const [filteredItems, setFilteredItems] = useState<Record<string, unknown>[]>([]);
  const [displayFields, setDisplayFields] = useState<string[]>([]);
  
  // Reset state when refreshKey changes to ensure fresh data
  useEffect(() => {
    setAllItems([]);
    setFilteredItems([]);
  }, [refreshKey]);
  
  // Handle items loaded from TableClient
  const handleItemsLoaded = (items: Record<string, unknown>[]) => {
    setAllItems(items);
    setFilteredItems(items); // Initially all items are shown
    
    // Use tableFields from the configuration if available
    const tableConfig = configs[tableName as keyof typeof configs];
    if (tableConfig && tableConfig.tableFields && tableConfig.tableFields.length > 0) {
      setDisplayFields(tableConfig.tableFields);
    } else if (items.length > 0) {
      // Fallback to determining display fields from the loaded items
      setDisplayFields(Object.keys(items[0]));
    }
  };
  
  // Handle filtered items from search
  const handleFilteredItemsChange = (items: Record<string, unknown>[]) => {
    setFilteredItems(items);
  };
  
  // Track if data has been loaded at least once
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Determine if we should show the table or a no results message
  const showNoResultsMessage = dataLoaded && allItems.length > 0 && filteredItems.length === 0;
  
  // Handle items loaded from TableClient with additional check
  const handleItemsLoadedWithCheck = (items: Record<string, unknown>[]) => {
    handleItemsLoaded(items);
    setDataLoaded(true);
  };
  
  return (
    <div>
      {allItems.length > 0 && (
        <TableSearch
          displayFields={displayFields}
          items={allItems}
          onFilteredItemsChange={handleFilteredItemsChange}
        />
      )}
      
      {showNoResultsMessage ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
          <p className="text-gray-500">No matching items found.</p>
          <button 
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            onClick={() => handleFilteredItemsChange(allItems)}
          >
            Clear search
          </button>
        </div>
      ) : (
        <TableClient
          configs={configs}
          tableName={tableName}
          inlineMode={inlineMode}
          onSelectItem={onSelectItem}
          refreshKey={refreshKey}
          items={filteredItems.length > 0 ? filteredItems : undefined}
          onItemsLoaded={handleItemsLoadedWithCheck}
        />
      )}
    </div>
  );
}
