'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FieldDef, FormValues } from './FormTypes';
import { TableConfig } from '@/lib/types/tablesConfigTypes';
import { FieldProvider } from './fields/FieldContext';
import {
  TextField,
  NumberField,
  TextAreaField,
  SelectField,
  BooleanField,
  DateField,
  DateTimeField,
  RelationField,
  RelationManyField,
  RelationAliasField,
  ManyToManyField,
  RichTextField,
  ImageField,
  RelatedItemsField
} from './fields';

interface RenderFieldProps {
  field: FieldDef;
  form: UseFormReturn<FormValues>;
  mergedConfigs: Record<string, TableConfig>;
}

const RenderField: React.FC<RenderFieldProps> = ({ field, form, mergedConfigs }) => {
  // Provide the field context to the appropriate field component
  return (
    <FieldProvider field={field} form={form} mergedConfigs={mergedConfigs}>
      {renderFieldByType(field.type)}
    </FieldProvider>
  );
};

// Helper function to render the appropriate field component based on type
const renderFieldByType = (type: string) => {
  switch (type) {
    case 'text':
    case 'email':
    case 'password':
      return <TextField />;
      
    case 'number':
      return <NumberField />;
      
    case 'textarea':
      return <TextAreaField />;
      
    case 'boolean':
      return <BooleanField />;
      
    case 'select':
      return <SelectField />;
      
    case 'date':
      return <DateField />;
      
    case 'datetime':
      return <DateTimeField />;
      
    case 'richtext':
      return <RichTextField />;
      
    case 'image':
      return <ImageField />;
      
    case 'relation':
      return <RelationField />;
      
    case 'relation_many':
      return <RelationManyField />;
      
    case 'relation_alias':
      return <RelationAliasField />;
      
    case 'relation_m-m':
      return <ManyToManyField />;
      
    case 'related_items':
      return <RelatedItemsField />;
      
    default:
      return <div>Unsupported field type: {type}</div>;
  }
};

export default RenderField;