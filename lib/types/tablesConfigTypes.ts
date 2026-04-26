import { FieldDef } from "@/components/editor/FormTypes";
import { QueryOptions } from "@/lib/services/DataTypes";

/**
 * Configuration for tables that can be viewed in the admin content section
 * Each table has a display name and optional configuration
 */
export type TableConfig = {
  displayName: string;
  description?: string;
  icon?: string;
  tableFields?: string[]; // Fields to display in the table view (order is preserved)
  queryOptions?: QueryOptions<unknown>; // Query options for fetching data (filters, ordering, pagination)
  formFields?: FieldDef[]; // Field definitions for the editor form
  viewable: boolean;
  editable: boolean;
  deletable?: boolean; // Whether items in this table can be deleted (defaults to false)
  searchMode?: 'client' | 'server'; // Whether to use client-side or server-side search (defaults to server)
};