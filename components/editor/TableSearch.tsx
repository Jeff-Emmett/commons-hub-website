'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface TableSearchProps {
  displayFields: string[];
  items: Record<string, unknown>[];
  onFilteredItemsChange: (filteredItems: Record<string, unknown>[]) => void;
}

export default function TableSearch({ 
  displayFields, 
  items,
  onFilteredItemsChange
}: TableSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFields, setSearchFields] = useState<string[]>([]);
  const [showSearchOptions, setShowSearchOptions] = useState<boolean>(false);

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    performSearch(query, searchFields);
  };
  
  // Perform the actual search
  const performSearch = (query: string, fields: string[] = []) => {
    if (!query.trim()) {
      // If search query is empty, show all items
      onFilteredItemsChange(items);
      return;
    }
    
    // Only search in the fields that are passed from TableSearchClient
    // These fields come from the tableFields configuration
    const fieldsToSearch = fields.length > 0 ? fields : displayFields;
    
    // Filter items based on search query and selected fields
    const filtered = items.filter(item => {
      return fieldsToSearch.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        
        // Convert value to string for searching
        const stringValue = String(value).toLowerCase();
        return stringValue.includes(query.toLowerCase());
      });
    });
    
    onFilteredItemsChange(filtered);
  };

  // Toggle search field selection
  const toggleSearchField = (field: string) => {
    const updatedFields = searchFields.includes(field)
      ? searchFields.filter(f => f !== field)
      : [...searchFields, field];
    
    setSearchFields(updatedFields);
    performSearch(searchQuery, updatedFields);
  };

  // Clear all selected fields (search in all fields)
  const clearFieldSelection = () => {
    setSearchFields([]);
    performSearch(searchQuery, []);
  };
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-options-container') && !target.closest('.search-options-button')) {
        setShowSearchOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-10 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="relative">
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm search-options-button"
            onClick={() => setShowSearchOptions(!showSearchOptions)}
          >
            Search Options
          </button>
          {showSearchOptions && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3 search-options-container">
              <h4 className="font-medium text-sm mb-2">Search in fields:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {displayFields.map(field => (
                  <label key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={searchFields.length === 0 || searchFields.includes(field)}
                      onChange={() => toggleSearchField(field)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{field.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between">
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={clearFieldSelection}
                >
                  Search All Fields
                </button>
                <button 
                  className="text-xs text-gray-600 hover:text-gray-800"
                  onClick={() => setShowSearchOptions(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {searchQuery && (
        <div className="mt-2 text-sm text-gray-500">
          Found {items.filter(item => {
            if (!searchQuery.trim()) return true;
            
            const fieldsToSearch = searchFields.length > 0 ? searchFields : displayFields;
            
            return fieldsToSearch.some(field => {
              const value = item[field];
              if (value === null || value === undefined) return false;
              return String(value).toLowerCase().includes(searchQuery.toLowerCase());
            });
          }).length} of {items.length} items
          {searchFields.length > 0 && (
            <span> in selected fields</span>
          )}
        </div>
      )}
    </div>
  );
}
