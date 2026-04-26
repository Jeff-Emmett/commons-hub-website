'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FieldDef, FormValues, RichtextFieldDef } from './FormTypes';
import FormWrapper from './FormWrapper';
import RenderField from './RenderField';
import { TableConfig } from '@/lib/types/tablesConfigTypes';
import { useTableConfig } from '@/lib/contexts/TableConfigContext';

interface CancelButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

interface DynamicFormProps {
  configs: Record<string, TableConfig>;
  fields: FieldDef[];
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  cancelButton?: CancelButtonProps;
  noForm?: boolean; // When true, renders without the form element
}

export default function DynamicForm({
  configs,
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = 'Save',
  isSubmitting = false,
  cancelButton,
  noForm = false,
}: DynamicFormProps) {
  // Get configs from context as fallback
  const contextConfigs = useTableConfig();
  
  // Use props configs if available, otherwise fall back to context configs
  const mergedConfigs = configs && Object.keys(configs).length > 0 ? configs : contextConfigs;
  // Build Zod schema dynamically based on field definitions
  const [schema, setSchema] = useState<z.ZodObject<z.ZodRawShape>>();
  
  // Create the schema when fields change
  useEffect(() => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      
      // Base type based on field type
      switch (field.type) {
        case 'text': {
          let strSchema = z.string();
          // Apply Zod string validations
          if (field.min !== undefined) strSchema = strSchema.min(field.min);
          if (field.max !== undefined) strSchema = strSchema.max(field.max);
          if (field.length !== undefined) strSchema = strSchema.length(field.length);
          if (field.regex) strSchema = strSchema.regex(field.regex);
          if (field.startsWith) strSchema = strSchema.startsWith(field.startsWith);
          if (field.endsWith) strSchema = strSchema.endsWith(field.endsWith);
          if (field.includes) strSchema = strSchema.includes(field.includes);
          
          // Apply transformations
          if (field.trim) strSchema = strSchema.trim();
          if (field.toLowerCase) strSchema = strSchema.toLowerCase();
          if (field.toUpperCase) strSchema = strSchema.toUpperCase();
          
          fieldSchema = strSchema;
          break;
        }
          
        case 'textarea': {
          let strSchema = z.string();
          // Apply Zod string validations
          if (field.min !== undefined) strSchema = strSchema.min(field.min);
          if (field.max !== undefined) strSchema = strSchema.max(field.max);
          if (field.length !== undefined) strSchema = strSchema.length(field.length);
          if (field.regex) strSchema = strSchema.regex(field.regex);
          if (field.startsWith) strSchema = strSchema.startsWith(field.startsWith);
          if (field.endsWith) strSchema = strSchema.endsWith(field.endsWith);
          if (field.includes) strSchema = strSchema.includes(field.includes);
          
          // Apply transformations
          if (field.trim) strSchema = strSchema.trim();
          if (field.toLowerCase) strSchema = strSchema.toLowerCase();
          if (field.toUpperCase) strSchema = strSchema.toUpperCase();
          
          fieldSchema = strSchema;
          break;
        }
          
        case 'richtext': {
          // For richtext fields, we use a simple string schema
          // with optional validation if specified
          let strSchema = z.string();
          
          // Only apply validations if they exist on the field
          const richtextField = field as RichtextFieldDef;
          if (richtextField.min !== undefined) strSchema = strSchema.min(richtextField.min);
          if (richtextField.max !== undefined) strSchema = strSchema.max(richtextField.max);
          if (richtextField.length !== undefined) strSchema = strSchema.length(richtextField.length);
          if (richtextField.regex) strSchema = strSchema.regex(richtextField.regex);
          if (richtextField.startsWith) strSchema = strSchema.startsWith(richtextField.startsWith);
          if (richtextField.endsWith) strSchema = strSchema.endsWith(richtextField.endsWith);
          if (richtextField.includes) strSchema = strSchema.includes(richtextField.includes);
          
          // Apply transformations if specified
          if (richtextField.trim) strSchema = strSchema.trim();
          if (richtextField.toLowerCase) strSchema = strSchema.toLowerCase();
          if (richtextField.toUpperCase) strSchema = strSchema.toUpperCase();
          
          fieldSchema = strSchema;
          break;
        }
          
        case 'number': {
          // Use a local variable with the correct type
          let numSchema = z.number();
          
          // Apply Zod validations based on field properties
          if (field.gte !== undefined) numSchema = numSchema.gte(field.gte);
          if (field.lte !== undefined) numSchema = numSchema.lte(field.lte);
          if (field.multipleOf !== undefined) numSchema = numSchema.multipleOf(field.multipleOf);
          if (field.gt !== undefined) numSchema = numSchema.gt(field.gt);
          if (field.lt !== undefined) numSchema = numSchema.lt(field.lt);
          if (field.positive) numSchema = numSchema.positive();
          if (field.nonnegative) numSchema = numSchema.nonnegative();
          if (field.negative) numSchema = numSchema.negative();
          if (field.nonpositive) numSchema = numSchema.nonpositive();
          
          // Make optional if not required
          fieldSchema = field.required ? numSchema : numSchema.optional();
          break;
        }
          

          
        case 'image': {
          // For image fields, we store the image ID as a string or null
          fieldSchema = z.string().nullable().optional();
          break;
        }
        
        case 'relation': {
          // For relation fields, we store the related item ID as a string
          fieldSchema = z.string().optional();
          break;
        }
        
        case 'relation_many': {
          // For relation_many fields, we store an array of related item IDs
          fieldSchema = z.array(z.string()).optional();
          break;
        }
        
        case 'related_items': {
          // For related_items fields, we don't need validation as they're display-only
          // and don't get submitted with the form
          fieldSchema = z.any().optional();
          break;
        }
        
        case 'relation_m-m': {
          // For relation_m-m fields, we store an array of related item IDs
          // Similar to relation_many but handled differently in the UI
          fieldSchema = z.array(z.string()).optional();
          break;
        }
          
        case 'email':
          fieldSchema = z.string().email();
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
          
        case 'select':
          if (field.multiple) {
            fieldSchema = z.array(z.string().or(z.number()));
          } else {
            fieldSchema = z.string().or(z.number());
          }
          break;
          
        case 'date': {
          // For date fields, we validate that it's a valid date string
          const dateSchema = z.string().refine((val) => {
            // Allow empty strings to be treated as null/undefined for optional fields
            if (val === '') return true;
            return !isNaN(Date.parse(val));
          }, {
            message: "Invalid date format"
          });
          
          // Transform empty strings to undefined for consistency
          fieldSchema = dateSchema.transform(val => val === '' ? undefined : val);
          break;
        }
          
        case 'datetime': {
          // For datetime fields, we validate that it's a valid datetime string
          const dateTimeSchema = z.string().refine((val) => {
            // Allow empty strings to be treated as null/undefined for optional fields
            if (val === '') return true;
            return !isNaN(Date.parse(val));
          }, {
            message: "Invalid datetime format"
          });
          
          // Transform empty strings to undefined for consistency
          fieldSchema = dateTimeSchema.transform(val => val === '' ? undefined : val);
          break;
        }  
        default:
          fieldSchema = z.string();
      }
      
      // Apply required constraint
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaFields[field.name] = fieldSchema;
    });
    
    setSchema(z.object(schemaFields));
  }, [fields]);
  
  // Set up form with react-hook-form and zod resolver
  const form = useForm<FormValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: initialValues,
  });
  
  // Update form values when initialValues change
  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach(key => {
        form.setValue(key, initialValues[key]);
      });
    }
  }, [initialValues, form]);
  
  // Create a custom submit handler that prevents event propagation when in a nested form
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // If this is a nested form (noForm=true), prevent the event from bubbling up
    if (noForm) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Use the react-hook-form handleSubmit
    form.handleSubmit((data) => {
      onSubmit(data);
    })(event);
  };
  
  return (
    <FormWrapper noForm={noForm} onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          {field.type !== 'boolean' && (
            <label 
              htmlFor={field.name} 
              className="block text-sm font-medium text-gray-700"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          
          <div className="mt-1">
            <RenderField field={field} form={form} mergedConfigs={mergedConfigs} />
          </div>
          
          {field.helpText && field.type !== 'boolean' && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          
          {form.formState.errors[field.name] && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors[field.name]?.message as string}
            </p>
          )}
        </div>
      ))}
      
      <div className="pt-5">
      <div className="flex justify-end space-x-3">
        {cancelButton && (
          <button
            type="button"
            onClick={cancelButton.onClick}
              disabled={cancelButton.disabled}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          onClick={(e) => {
            if (noForm) {
              // For nested forms, handle the click manually to prevent bubbling
              e.preventDefault();
              e.stopPropagation();
              
              // Manually trigger form submission
              form.handleSubmit((data) => {
                onSubmit(data);
              })();
            }
          }}
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
      </FormWrapper>
  );
}
