import { Database } from '../database.types';

// Type for table rows
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Type for table inserts
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

// Type for table updates
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Type aliases for database tables
export type Tables = Database['public']['Tables'];



// Filter types
export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'like' 
  | 'ilike' 
  | 'is' 
  | 'in' 
  | 'cs' 
  | 'cd';

export type FilterCondition<T> = {
  column: keyof T | string;
  operator: FilterOperator;
  value: unknown;
};

export type OrderDirection = 'asc' | 'desc';

export type OrderBy<T> = {
  column: keyof T | string;
  direction: OrderDirection;
};

export type QueryOptions<T> = {
  filters?: FilterCondition<T>[];
  sortField?: string;
  sortDirection?: OrderDirection;
  page?: number;
  pageSize?: number;
  select?: string;
};

// Common table types for easier access
export type Page = TableRow<'pages'>;
export type Post = TableRow<'posts'>;
export type Category = TableRow<'categories'>;
export type Menu = TableRow<'menu'>;
export type TeamMember = TableRow<'team_members'>;
export type Accordion = TableRow<'accordions'>;
export type AccordionItem = TableRow<'accordion_items'>;
export type UserRole = TableRow<'user_roles'>;
export type Profile = TableRow<'profiles'>;
export type PublicProfile = TableRow<'public_profiles'>;
