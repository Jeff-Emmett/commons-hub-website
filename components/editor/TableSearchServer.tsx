'use client';

import { useState, useEffect } from 'react';
import TableClient from './TableClient';
import { Search, X } from 'lucide-react';
import { Tables } from '@/lib/services/DataTypes';
import { dataService } from '@/lib/services/DataService';
import { TableConfig } from '@/lib/types/tablesConfigTypes';
import { useRouter } from 'next/navigation';

interface TableSearchServerProps {
  configs: Record<string, TableConfig>;
  tableName: keyof Tables;
  inlineMode?: boolean;
  onSelectItem?: (itemId: string) => void;
  refreshKey?: number;
}

export default function TableSearchServer({
  configs,
  tableName,
  inlineMode = false,
  onSelectItem,
  refreshKey = 0
}: TableSearchServerProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Validate that the table is allowed to be viewed
  const tableConfig = configs[tableName as keyof typeof configs];
  const isValidTable = tableConfig && tableConfig.viewable;
  
  // Load available fields from table config
  useEffect(() => {
    // Redirect if table is not valid
    if (!isValidTable) {
      router.push('/admin/unauthorized');
      return;
    }
    const tableConfig = configs[tableName as keyof typeof configs];
    if (tableConfig && tableConfig.tableFields) {
      setAvailableFields(tableConfig.tableFields);
      // Set the first field as default selected field
      if (tableConfig.tableFields.length > 0) {
        setSelectedField(tableConfig.tableFields[0]);
      }
    }
  }, [tableName]);
  
  // Server-side search function
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setError(null);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Make sure we have a field to search in
      if (!selectedField) {
        console.log('Error: No field selected for search');
        setError('No field selected for search');
        setSearchResults([]);
        setSearchPerformed(true);
        return;
      }
            
      // Call the search method with a single field
      try {
        const data = await dataService.search(
          tableName,
          selectedField,
          query,
          '*' // Select all columns
        );
        
        // The data is now properly returned directly from the DataService
        // Convert to unknown first to safely cast to the expected type
        const safeData = data || [];
        setSearchResults(safeData as unknown as Record<string, unknown>[]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Search failed';
        setError(errorMessage);
        setSearchResults([]);
      }
      
      setSearchPerformed(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : 
        typeof error === 'string' ? error : 
        'An error occurred during search'
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Select a field for search
  const selectField = (field: string) => {
    setSelectedField(field);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
  };
  
  return (
    <div>
      {/* Server-side search UI */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search (server-side)..."
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
            />
            {searchQuery && (
              <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <select
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            value={selectedField}
            onChange={(e) => selectField(e.target.value)}
          >
            {availableFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-2 text-sm text-red-500">
            Error: {error}
          </div>
        )}
        
        {/* Search results info */}
        {searchPerformed && !error && (
          <div className="mt-2 text-sm text-gray-500">
            {searchResults.length === 0 ? (
              <p>No results found for &quot;{searchQuery}&quot;</p>
            ) : (
              <p>Found {searchResults.length} results for &quot;{searchQuery}&quot;</p>
            )}
          </div>
        )}
      
      {/* Show search results if search was performed, otherwise show normal table */}
      <TableClient
        configs={configs}
        tableName={tableName}
        inlineMode={inlineMode}
        onSelectItem={onSelectItem}
        refreshKey={refreshKey}
        items={searchPerformed ? searchResults : undefined}
      />
      
      {/* Show clear search button if search was performed but no results found */}
      {searchPerformed && searchResults.length === 0 && (
        <div className="text-center py-4 mt-2">
          <button 
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={clearSearch}
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
