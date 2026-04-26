import React, { useState, useEffect } from 'react';
import { useField } from './FieldContext';
import { RelationAliasFieldDef } from '../FormTypes';
import { dataService } from '@/lib/services/DataService';

export const RelationAliasField: React.FC = () => {
  const { field, form } = useField();
  const relationField = field as RelationAliasFieldDef;
  
  const [relatedItems, setRelatedItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newItemValue, setNewItemValue] = useState('');
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemValue, setEditItemValue] = useState('');
  
  // Get the current record ID and ensure it's properly typed
  const recordId = form.getValues('id') as string | number | undefined | null;
  
  // Function to fetch related items
  const fetchRelatedItems = async () => {
    if (!recordId) {
      setRelatedItems([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Construct the query to find items where foreignKey = recordId
      const query = `${relationField.foreignKey}.eq.${recordId}`;
      
      // Set up options for sorting and limiting results
      const options = {
        page: 1,
        pageSize: relationField.limit || 10,
        sortField: relationField.sortField || 'id',
        sortDirection: relationField.sortDirection || 'asc',
        query
      };
      
      // Fetch the related items
      const result = await dataService.getAll(relationField.tableName, options);
      setRelatedItems(result.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching related items:', err);
      setError('Failed to load related items');
      setRelatedItems([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch related items when the component mounts or recordId changes
  useEffect(() => {
    fetchRelatedItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, relationField.tableName, relationField.foreignKey, relationField.limit, relationField.sortField, relationField.sortDirection]);
  
  // Handle creating a new related item
  const handleCreateItem = async () => {
    if (!newItemValue.trim() || !recordId) return;
    
    try {
      // Create the new related item with a reference to the current record
      const newItem = {
        [relationField.displayField]: newItemValue,
        [relationField.foreignKey]: recordId
      };
      
      await dataService.create(relationField.tableName, newItem);
      
      // Reset form and refresh the list
      setNewItemValue('');
      setShowCreateForm(false);
      
      // Refetch related items
      fetchRelatedItems();
    } catch (err) {
      console.error('Error creating related item:', err);
      setError('Failed to create related item');
    }
  };
  
  // Handle editing an existing item
  const startEditItem = (item: Record<string, unknown>) => {
    setEditItemId(String(item.id));
    setEditItemValue(String(item[relationField.displayField] || ''));
    setShowEditForm(true);
    setShowCreateForm(false);
  };
  
  // Handle updating an item
  const handleUpdateItem = async () => {
    if (!editItemId || !editItemValue.trim()) return;
    
    try {
      // Update the item
      await dataService.update(relationField.tableName, editItemId, {
        [relationField.displayField]: editItemValue
      });
      
      // Reset form and refresh the list
      setEditItemId(null);
      setEditItemValue('');
      setShowEditForm(false);
      
      // Refetch related items
      fetchRelatedItems();
    } catch (err) {
      console.error('Error updating related item:', err);
      setError('Failed to update related item');
    }
  };
  
  // Handle deleting an item
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      // Delete the item
      await dataService.delete(relationField.tableName, itemId);
      
      // Refetch related items
      fetchRelatedItems();
    } catch (err) {
      console.error('Error deleting related item:', err);
      setError('Failed to delete related item');
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">{relationField.label}</div>
        {recordId && (
          <button 
            type="button" 
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (showEditForm) {
                setShowEditForm(false);
                setEditItemId(null);
                setEditItemValue('');
              }
            }}
          >
            {showCreateForm ? 'Cancel' : 'Add New'}
          </button>
        )}
      </div>
      
      {showCreateForm && recordId && (
        <div className="mb-4 p-3 border rounded-md bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              placeholder={`Enter ${relationField.displayField.replace(/_/g, ' ')}`}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              type="button"
              onClick={handleCreateItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      )}
      
      {showEditForm && editItemId && (
        <div className="mb-4 p-3 border rounded-md bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={editItemValue}
              onChange={(e) => setEditItemValue(e.target.value)}
              placeholder={`Edit ${relationField.displayField.replace(/_/g, ' ')}`}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              type="button"
              onClick={handleUpdateItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEditForm(false);
                setEditItemId(null);
                setEditItemValue('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-sm text-gray-500">Loading related items...</div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : relatedItems.length === 0 ? (
        <div className="text-sm text-gray-500">No related items found</div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {relationField.displayField.replace(/_/g, ' ')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {relatedItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {String(item[relationField.displayField] || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => startEditItem(item)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(String(item.id))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RelationAliasField;
