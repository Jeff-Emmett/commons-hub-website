'use client';

import { useEffect, useState } from 'react';
import { dataService } from '@/lib/services/DataService';
import { Tables, OrderDirection } from '@/lib/services/DataTypes';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown } from 'lucide-react';
import { TableConfig } from '@/lib/types/tablesConfigTypes';

interface TableClientProps {
  configs: Record<string, TableConfig>;
  tableName: keyof Tables;
  inlineMode?: boolean; // Whether the component is used inline with an editor
  onSelectItem?: (itemId: string) => void; // Callback when an item is selected
  refreshKey?: number; // Key to trigger data refresh
  items?: Record<string, unknown>[]; // Optional items to display (if provided, won't fetch)
  onItemsLoaded?: (items: Record<string, unknown>[]) => void; // Callback when items are loaded
}

export default function TableClient({ 
  configs,
  tableName, 
  inlineMode = false, 
  onSelectItem, 
  refreshKey = 0,
  items: providedItems,
  onItemsLoaded
}: TableClientProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>(providedItems || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  
  // Validate that the table is allowed to be viewed
  const tableConfig = configs[tableName as keyof typeof configs];
  const isValidTable = tableConfig && tableConfig.viewable;
  
  // Initialize sort field and direction from config when table changes
  useEffect(() => {
    if (isValidTable) {
      // Set initial sort field and direction from queryOptions or use defaults
      const queryOptions = tableConfig.queryOptions;
      
      // Set initial sort field from config or default to first field or 'id'
      const initialSortField = queryOptions?.sortField || 
        (tableConfig.tableFields && tableConfig.tableFields.length > 0 ? tableConfig.tableFields[0] : 'id');
      
      // Set initial sort direction from config or default to 'asc'
      const initialSortDirection = queryOptions?.sortDirection || 'asc';
      
      setSortField(initialSortField);
      setSortDirection(initialSortDirection as 'asc' | 'desc');
    }
  }, [tableName, isValidTable, tableConfig]);

  useEffect(() => {
    if (providedItems) {
      setItems(providedItems);
      setLoading(false);
    }
  }, [providedItems]);
  
  // Define fetchTableData function
  async function fetchTableData() {
    // For initial load, show full loading state
    if (items.length === 0) {
      setLoading(true);
    }
    
    // We don't need to specify fields to fetch as the DataService handles this
    const currentSortField = sortField || 'id';
    const ascending = sortDirection === 'asc';
    const sortDir: OrderDirection = ascending ? 'asc' : 'desc';
    
    // Create options for the dataService.getAll method
    const options = {
      page: 1,
      pageSize: 50,
      sortField: currentSortField,
      sortDirection: sortDir
    };
    
    try {
      // The updated dataService.getAll returns { data, pagination }
      const result = await dataService.getAll(
        tableName, 
        options
      );
      
      // Set the items from the returned data
      setItems(result.data);
      
      // Notify parent component about loaded items
      if (onItemsLoaded) {
        onItemsLoaded(result.data);
      }
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error fetching data: ${errorMessage}`);
      console.error(error);
    }
    
    setLoading(false);
  }
  
  // Dedicated effect for data fetching - runs when tableName, refreshKey, or sort parameters change
  useEffect(() => {
    // Only fetch data if we're not using provided items
    if (isValidTable && !providedItems) {
      fetchTableData();
    } else if (providedItems && providedItems.length === 0 && onItemsLoaded) {
      // If we have empty provided items, notify parent immediately to avoid loops
      onItemsLoaded([]);
    }
  }, [tableName, refreshKey, sortField, sortDirection, isValidTable, providedItems]);

  // Dedicated effect for validation - runs when tableName or configs change
  useEffect(() => {
    // Redirect if invalid table
    if (!isValidTable) {
      router.push('/admin/unauthorized');
      return;
    }
  }, [isValidTable, router]);

  // Refetch data when refreshKey changes
  useEffect(() => {
    if (!providedItems && isValidTable) {
      fetchTableData();
    }
  }, [refreshKey, providedItems, isValidTable]);

  
  if (!isValidTable) {
    return null; // Will redirect in useEffect
  }
  
  // Determine which fields to display in the table
  const determineDisplayFields = (items: Record<string, unknown>[]): string[] => {
    if (items.length === 0) return ['id'];
    
    // If tableFields are specified in the config, use those
    if (tableConfig.tableFields && tableConfig.tableFields.length > 0) {
      const allFields = Object.keys(items[0]);
      // Only return fields that actually exist in the data
      return tableConfig.tableFields.filter(field => allFields.includes(field));
    }
    
    // Otherwise, determine fields dynamically
    const allFields = Object.keys(items[0]);
    
    // Always include the first field from the config if available
    const firstField = tableConfig.tableFields && tableConfig.tableFields.length > 0 
      ? tableConfig.tableFields[0] 
      : 'id';
    const baseFields = allFields.includes(firstField) ? [firstField] : [];
    
    // Add other fields up to a reasonable limit, excluding system and relationship fields
    const displayableFields = allFields
      .filter(field => !baseFields.includes(field))
      .filter(field => 
        !field.includes('_id') && 
        field !== 'content' && 
        field !== 'body' &&
        !field.startsWith('user_')
      );
    
    // Return a combination of base fields and some additional fields
    return [...baseFields, ...displayableFields.slice(0, 5)];
  };
  
  const displayFields = determineDisplayFields(items);
  
  // Handle column header click for sorting
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Optimistically sort the data client-side while waiting for server response
    const sortedItems = [...items].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      } else {
        // For numbers, booleans, dates
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });
    
    setItems(sortedItems);
  };
  
  // Render sort indicator for column headers
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) {
      return <ChevronsUpDown className="inline-block ml-1 h-4 w-4 text-gray-400" />;
    }
    
    return sortDirection === 'asc' 
      ? <span className="ml-1">↑</span>
      : <span className="ml-1">↓</span>;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg">
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {displayFields.map(field => (
                  <th 
                    key={field} 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSortChange(field)}
                  >
                    <div className="flex items-center">
                      <span>{field.replace(/_/g, ' ')}</span>
                      {renderSortIndicator(field)}
                    </div>
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr 
                  key={typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : 'row'} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (inlineMode && onSelectItem) {
                      onSelectItem(typeof item.id === 'string' ? item.id : String(item.id));
                    } else if (tableConfig.editable) {
                      router.push(`/admin/content/${tableName}/${typeof item.id === 'string' || typeof item.id === 'number' ? item.id : ''}`);
                    }
                  }}
                >
                  {displayFields.map(field => (
                    <td 
                      key={`${typeof item.id === 'string' || typeof item.id === 'number' ? item.id : 'item'}-${field}`} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {renderCellContent((item as Record<string, unknown>)[field], field)}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {tableConfig.deletable && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Confirm before deleting
                          if (window.confirm(`Are you sure you want to delete this ${tableName}?`)) {
                            try {
                              await dataService.delete(tableName, String(item.id));
                              // Refresh the table data after successful deletion
                              fetchTableData();
                            } catch (error) {
                              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                              setError(`Error deleting item: ${errorMessage}`);
                              console.error(error);
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Helper function to render cell content based on field type
function renderCellContent(value: unknown, fieldName: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }
  
  // Handle dates
  if (fieldName.includes('date') && typeof value === 'string') {
    try {
      const date = new Date(value);
      return date.toLocaleDateString();
    } catch {
      return String(value);
    }
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 
      <span className="text-green-600">Yes</span> : 
      <span className="text-red-600">No</span>;
  }
  
  // Handle long text
  if (typeof value === 'string' && value.length > 100) {
    return `${value.substring(0, 100)}...`;
  }
  
  // Convert any non-renderable values to strings
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Return primitive values directly
  return String(value);
}
