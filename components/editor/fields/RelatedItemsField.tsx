import React from 'react';
import { useField } from './FieldContext';
import { RelatedItemsFieldDef } from '../FormTypes';
import RelatedItemsPanel from '../RelatedItemsPanel';

export const RelatedItemsField: React.FC = () => {
  const { field, form, mergedConfigs } = useField();
  const relatedItemsField = field as RelatedItemsFieldDef;
  const formValues = form.getValues();
  // Ensure currentItemId is a string or number
  const currentItemId = typeof formValues.id === 'string' || typeof formValues.id === 'number' 
    ? formValues.id 
    : null;
  
  // Check if currentItemId exists and is of the correct type
  if (!currentItemId) {
    return (
      <div className="text-gray-500 italic p-4 border border-gray-200 rounded-md">
        Save this record first to view related items
      </div>
    );
  }
  
  return (
    <RelatedItemsPanel
      configs={mergedConfigs}
      parentId={currentItemId}
      relatedTable={relatedItemsField.relatedTable}
      foreignKey={relatedItemsField.foreignKey}
      displayFields={relatedItemsField.displayFields}
      titleFields={relatedItemsField.titleFields}
    />
  );
};

export default RelatedItemsField;
