import { QueryOptions } from '@/lib/services/DataTypes';
/**
 * Types for dynamic form fields
 */

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'email'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'image'
  | 'relation'
  | 'relation_many'
  | 'relation_alias'
  | 'relation_m-m'
  | 'related_items';

/**
 * Base field definition
 */
export interface BaseFieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  defaultValue?: unknown;
  disabled?: boolean;
}

/**
 * Text field definition
 * Using Zod terminology for validation methods
 */
export interface TextFieldDef extends BaseFieldDef {
  type: 'text';
  min?: number;      // Minimum length (Zod's min for strings)
  max?: number;      // Maximum length (Zod's max for strings)
  length?: number;   // Exact length
  regex?: RegExp;    // Regular expression pattern
  startsWith?: string; // String must start with
  endsWith?: string;   // String must end with
  includes?: string;   // String must include
  trim?: boolean;      // Trim whitespace
  toLowerCase?: boolean; // Convert to lowercase
  toUpperCase?: boolean; // Convert to uppercase
  placeholder?: string;
}

/**
 * Textarea field definition
 * Using Zod terminology for validation methods
 */
export interface TextareaFieldDef extends BaseFieldDef {
  type: 'textarea';
  min?: number;      // Minimum length (Zod's min for strings)
  max?: number;      // Maximum length (Zod's max for strings)
  length?: number;   // Exact length
  regex?: RegExp;    // Regular expression pattern
  startsWith?: string; // String must start with
  endsWith?: string;   // String must end with
  includes?: string;   // String must include
  trim?: boolean;      // Trim whitespace
  toLowerCase?: boolean; // Convert to lowercase
  toUpperCase?: boolean; // Convert to uppercase
  placeholder?: string;
  rows?: number;
}

/**
 * Richtext field definition
 * For rich text editor with formatting options
 */
export interface RichtextFieldDef extends BaseFieldDef {
  type: 'richtext';
  min?: number;      // Minimum length (Zod's min for strings)
  max?: number;      // Maximum length (Zod's max for strings)
  length?: number;   // Exact length
  regex?: RegExp;    // Regular expression pattern
  startsWith?: string; // String must start with
  endsWith?: string;   // String must end with
  includes?: string;   // String must include
  trim?: boolean;      // Trim whitespace
  toLowerCase?: boolean; // Convert to lowercase
  toUpperCase?: boolean; // Convert to uppercase
  rows?: number;
  placeholder?: string;
}

/**
 * Number field definition
 * Using Zod terminology for validation methods
 */
export interface NumberFieldDef extends BaseFieldDef {
  type: 'number';
  gte?: number;  // Greater than or equal (min value)
  lte?: number;  // Less than or equal (max value)
  multipleOf?: number;  // Step validation
  // Additional Zod number validations that could be useful
  gt?: number;   // Greater than
  lt?: number;   // Less than
  positive?: boolean;  // Value must be > 0
  nonnegative?: boolean;  // Value must be >= 0
  negative?: boolean;  // Value must be < 0
  nonpositive?: boolean;  // Value must be <= 0
}

/**
 * Email field definition
 */
export interface EmailFieldDef extends BaseFieldDef {
  type: 'email';
  placeholder?: string;
}

/**
 * Boolean field definition
 */
export interface BooleanFieldDef extends BaseFieldDef {
  type: 'boolean';
}

/**
 * Select field definition
 */
export interface SelectFieldDef extends BaseFieldDef {
  type: 'select';
  options: Array<{
    value: string | number;
    label: string;
  }>;
  multiple?: boolean;
}

/**
 * Date field definition
 */
export interface DateFieldDef extends BaseFieldDef {
  type: 'date';
  min?: string;
  max?: string;
}

/**
 * DateTime field definition
 */
export interface DateTimeFieldDef extends BaseFieldDef {
  type: 'datetime';
  min?: string;
  max?: string;
}

/**
 * Union type of all field definitions
 */
/**
 * Image field definition
 * For selecting images from the media library
 */
export interface ImageFieldDef extends BaseFieldDef {
  type: 'image';
  bucketName?: string; // Optional bucket name, defaults to 'website-images'
}

/**
 * Union type of all field definitions
 */


/**
 * Relation field definition for selecting a single related item
 */
export interface RelationFieldDef extends BaseFieldDef {
  type: 'relation';
  tableName: string; // The name of the related table
  displayField: string; // The field to display in the dropdown
  valueField?: string; // The field to use as the value (defaults to 'id')
  queryOptions?: QueryOptions<unknown>; // Additional options for the query
}

/**
 * Relation field definition for selecting multiple related items
 */
export interface RelationManyFieldDef extends BaseFieldDef {
  type: 'relation_many';
  tableName: string; // The name of the related table
  displayField: string; // The field to display in the selection list
  valueField?: string; // The field to use as the value (defaults to 'id')
  foreignKey?: string; // The foreign key field in the related table
}

/**
 * Relation many-to-many field definition for managing many-to-many relationships
 * This allows selecting multiple related items through a junction table
 */
export interface RelationManyToManyFieldDef extends BaseFieldDef {
  type: 'relation_m-m';
  parentTable: string; // The parent table name (the table this field is in)
  relatedTable: string; // The table containing the related items
  junctionTable: string; // The junction table that connects the two tables
  foreignKey: string; // The foreign key field in the junction table that references the parent table
  relatedKey: string; // The foreign key field in the junction table that references the related table
  displayFields: string[]; // Fields to display in the related items list
  titleFields?: string[]; // Fields to use as the title for each related item
  sortField?: string; // Field to sort related items by
  sortDirection?: 'asc' | 'desc'; // Sort direction
  limit?: number; // Maximum number of related items to show
}

/**
 * Related items field definition for displaying related items in a table/list
 * This is a read-only field that shows items related to the current record
 */
export interface RelatedItemsFieldDef extends BaseFieldDef {
  type: 'related_items';
  parentTable: string; // The parent table name (the table this field is in)
  relatedTable: string; // The table containing the related items
  foreignKey: string; // The foreign key field in the related table that references this table
  displayFields: string[]; // Fields to display in the related items list
  titleFields?: string[]; // Fields to use as the title for each related item
  sortField?: string; // Field to sort related items by
  sortDirection?: 'asc' | 'desc'; // Sort direction
  limit?: number; // Maximum number of related items to show
}

/**
 * Relation alias field definition for displaying related items that reference this record
 * This is a read-only field that shows items from another table that reference the current record
 */
export interface RelationAliasFieldDef extends BaseFieldDef {
  type: 'relation_alias';
  tableName: string; // The name of the related table
  foreignKey: string; // The foreign key field in the related table that references this record
  displayField: string; // The field to display in the selection list
  valueField?: string; // The field to use as the value (defaults to 'id')
  sortField?: string; // Field to sort related items by
  sortDirection?: 'asc' | 'desc'; // Sort direction
  limit?: number; // Maximum number of related items to show
}

/**
 * Union type of all field definitions
 */
export type FieldDef =
  | TextFieldDef
  | TextareaFieldDef
  | NumberFieldDef
  | EmailFieldDef
  | BooleanFieldDef
  | SelectFieldDef
  | DateFieldDef
  | DateTimeFieldDef
  | RichtextFieldDef
  | ImageFieldDef
  | RelationFieldDef
  | RelationManyFieldDef
  | RelationAliasFieldDef
  | RelationManyToManyFieldDef
  | RelatedItemsFieldDef;

/**
 * Form definition
 */
export interface FormDef {
  fields: FieldDef[];
}

/**
 * Form values
 */
export type FormValues = Record<string, unknown>;

