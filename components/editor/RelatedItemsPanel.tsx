import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/services/DataService';
import EditorClient from './EditorClient';
import { TableConfig } from '@/lib/types/tablesConfigTypes';
import { useTableConfig } from '@/lib/contexts/TableConfigContext';
import { Tables } from '@/lib/services/DataTypes';
import { formatCellValue } from '@/lib/utils/formatCellValue';

interface RelatedItemsPanelProps {
  configs: Record<string, TableConfig>;
  parentId: string | number;
  relatedTable: string;
  foreignKey: string;
  displayFields: string[];
  titleFields?: string[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  activeField?: string;
  uniqueRelation?: boolean;
}

const RelatedItemsPanel: React.FC<RelatedItemsPanelProps> = ({
  configs,
  parentId,
  relatedTable,
  foreignKey,
  displayFields,
  titleFields,
  sortField = 'id',
  sortDirection = 'asc',
  limit = 50,
  activeField,
  uniqueRelation=false
}) => {
  // Get table configs from context as a fallback
  const contextConfigs = useTableConfig();
  
  // Use props configs if available, otherwise fall back to context configs
  const mergedConfigs = configs && Object.keys(configs).length > 0 ? configs : contextConfigs;
  
  const [relatedItems, setRelatedItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fetch related items when the component mounts or when the parent ID changes
  // Initialize selected items based on activeField
  useEffect(() => {
    if (relatedItems.length > 0 && activeField) {
      const newSelectedIds = new Set<string>();
      relatedItems.forEach(item => {
        if (item[activeField]) {
          newSelectedIds.add(String(item.id));
        }
      });
      setSelectedItemIds(newSelectedIds);
    }
  }, [relatedItems, activeField]);

  useEffect(() => {
    const fetchRelatedItems = async () => {
      if (!parentId) {
        setRelatedItems([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await dataService.getRelatedItems(
          relatedTable,
          foreignKey,
          parentId,
          {
            sortField,
            sortDirection,
            pageSize: limit
          }
        );
        
        if (response.data) {
          setRelatedItems(response.data);
        } else {
          setRelatedItems([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching related items:', err);
        setError('Failed to load related items');
        setRelatedItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedItems();
  }, [parentId, relatedTable, foreignKey, sortField, sortDirection, limit, refreshKey]);
  
  // Function to toggle item expansion
  const handleToggleItem = (itemId: string | number) => {
    const itemIdStr = String(itemId);
    setExpandedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemIdStr)) {
        newSet.delete(itemIdStr);
      } else {
        newSet.add(itemIdStr);
      }
      return newSet;
    });
  };
  
  // Function to toggle item selection - only one item can be selected at a time
  const handleSelectItem = async (itemId: string | number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    const itemIdStr = String(itemId);
    const isCurrentlySelected = selectedItemIds.has(itemIdStr);
    
    // If the item is already selected, don't allow deselection (always one item must be selected)
    // If it's not selected, select it and deselect any other items
    if (isCurrentlySelected) {
      return; // Do nothing if trying to deselect the only selected item
    }
    
    // Create a new set with only this item selected
    const newSelectedIds = new Set<string>([itemIdStr]);
    
    // Update UI state
    setSelectedItemIds(newSelectedIds);
    
    // Update the activeField in the database if provided
    if (activeField) {
      // Find previously selected item to deactivate
      const previouslySelectedId = Array.from(selectedItemIds)[0];
      
      try {
        // Set the new item to active
        await dataService.update(relatedTable, itemIdStr, { [activeField]: true });
        
        // If there was a previously selected item and it's different from the current one, deactivate it
        if (previouslySelectedId && previouslySelectedId !== itemIdStr) {
          await dataService.update(relatedTable, previouslySelectedId, { [activeField]: false });
        }
      } catch (err) {
        console.error('Error updating item active state:', err);
        alert('Failed to update item status');
        
        // Revert UI state on error
        setSelectedItemIds(new Set(selectedItemIds));
      }
    }
  };
  
  // Function to delete an item
  const handleDeleteItem = async (itemId: string | number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    if (confirm(`Are you sure you want to delete this item?`)) {
      try {
        await dataService.delete(relatedTable, String(itemId));
        setRefreshKey(prev => prev + 1); // Refresh the list
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      }
    }
  };
  
  // Function to create a new related item inline
  const handleAddNew = () => {
    setExpandedItemIds(prev => new Set([...prev, 'new-item']));
  };
  
  // Function to handle save success
  const handleSaveSuccess = (itemId?: string) => {
    if (itemId) {
      setExpandedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        newSet.delete('new-item');
        return newSet;
      });
    }
    setRefreshKey(prev => prev + 1); // Trigger a refresh of the related items
  };
  
  // Function to handle cancel
  const handleCancel = (itemId?: string) => {
    if (itemId) {
      setExpandedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        newSet.delete('new-item');
        return newSet;
      });
    }
  };
  

  
  // Otherwise show the list of related items
  return (
    <div className="border border-gray-300 rounded-md p-4 mt-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{relatedTable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
        {/* Only show Add New button if not a unique relation or if there are no items yet */}
        {(!uniqueRelation || relatedItems.length === 0) && (
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            onClick={handleAddNew}
          >
            Add New Item
          </button>
        )}
      </div>
      
      {/* New Item Editor (if active) - always render this regardless of items */}
      {expandedItemIds.has('new-item') && (
        <div className="w-full border border-blue-300 rounded-lg p-4 bg-blue-50 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-blue-700">
              Add New {relatedTable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <button
              type="button"
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
              onClick={() => handleCancel('new-item')}
            >
              Cancel
            </button>
          </div>
          
          <EditorClient
            configs={mergedConfigs}
            key={`new-item-${refreshKey}`}
            tableName={relatedTable as keyof Tables}
            initialValues={{ [foreignKey]: parentId }}
            onSaveSuccess={() => handleSaveSuccess('new-item')}
            onCancel={() => handleCancel('new-item')}
            noForm={true} // Prevent nested forms
          />
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : (
        <div className="w-full space-y-6">
          
          {/* List of items */}
          {relatedItems.map((item) => {
            // Determine the title to display
            const itemId = String(item.id);
            const isExpanded = expandedItemIds.has(itemId);
            
            // Generate title based on titleFields array or fallback to item ID
            let itemTitle = `Item ${item.id}`;
            
            if (titleFields && Array.isArray(titleFields) && titleFields.length > 0) {
              // Build title from multiple fields
              const titleParts = titleFields.map(field => {
                return formatCellValue(item[field]);
              }).filter(part => part !== '');
              
              if (titleParts.length > 0) {
                itemTitle = titleParts.join(' - ');
              }
            }

            return (
              <div
                key={itemId}
                className={`w-full border rounded-lg p-4 transition-all ${isExpanded ? 'border-blue-300 bg-blue-50 relative cursor-pointer' : 'border-gray-200 bg-white hover:shadow-md cursor-pointer'}`}
                onClick={isExpanded ? () => handleToggleItem(itemId) : () => handleToggleItem(itemId)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    {!isExpanded && activeField && (
                      <div 
                        onClick={(e) => handleSelectItem(itemId, e)}
                        className={`w-6 h-6 rounded-full border ${selectedItemIds.has(itemId) ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'} flex items-center justify-center cursor-pointer`}
                        title={`${selectedItemIds.has(itemId) ? 'Deactivate' : 'Activate'} this item`}
                      >
                        {selectedItemIds.has(itemId) && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="font-medium text-lg text-blue-600" dangerouslySetInnerHTML={{ __html: itemTitle }}></div>
                  </div>
                  {!isExpanded && mergedConfigs[relatedTable]?.deletable !== false && (
                    <button
                      type="button"
                      className="px-3 py-1 border rounded-md text-sm text-red-600 hover:text-red-900 border-red-600 hover:bg-red-50"
                      onClick={(e) => handleDeleteItem(itemId, e)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                {isExpanded ? (
                  <>
                    {/* Editor content with stopPropagation to prevent clicks from collapsing */}
                    <div 
                      className="mt-4 bg-white p-4 rounded-md border border-gray-200" 
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'auto' }}
                    >
                      <EditorClient
                        configs={mergedConfigs}
                        key={`edit-${itemId}-${refreshKey}`}
                        tableName={relatedTable as keyof Tables}
                        itemId={itemId}
                        onSaveSuccess={() => handleSaveSuccess(itemId)}
                        onCancel={() => handleCancel(itemId)}
                        noForm={true} // Prevent nested forms
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 cursor-pointer">
                    {displayFields.filter(field => field).map((fieldName) => (
                      <div key={`${itemId}-${fieldName}`} className="text-sm flex flex-row">
                        <span className="text-gray-600 font-medium w-1/3">
                          {fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </span>
                        <span className="text-gray-800 w-2/3">
                          {formatCellValue(item[fieldName]) || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RelatedItemsPanel;
