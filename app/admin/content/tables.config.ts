import { TableConfig } from '@/lib/types/tablesConfigTypes';
import { UserRole } from '@/components/auth/ProtectedRoute';


/**
 * Configuration for the administration management section
 */
export const roleConfig = {
  requiredRole: ['admin', 'manager'] as UserRole[]
};

/**
 * Get the required role for a section
 */
export function getRequiredRole(): UserRole[] {
  return roleConfig.requiredRole;
}



/**
 * Tables configs available for viewing in the admin content section
 */
// Define a partial record type to allow us to only specify the tables we want to configure
export const tablesConfigs = {
  // Only these tables are viewable and editable
  
  menu: {
    displayName: 'Menu',
    description: 'Menu items and their content',
    icon: 'file-text',
    tableFields: ['menu_order', 'page_id'],
    queryOptions: {
      sortField: 'menu_order',
      sortDirection: 'asc'
    },
    formFields: [
      {
        name: 'menu_order',
        label: 'Menu Order',
        type: 'number',
        required: true,
        helpText: 'The order in which the menu item appears in the menu'
      },
      {
        name: 'page_id',
        label: 'Page',
        type: 'relation',
        tableName: 'pages',
        displayField: 'title',
        valueField: 'id',
        queryOptions: {
          sortField: 'title',
          sortDirection: 'asc',
          pageSize: 100
        },
        required: true,
        helpText: 'The page associated with the menu item'
      }
    ],
    viewable: true,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },

  pages: {
    displayName: 'Pages',
    description: 'Website pages and their content',
    icon: 'file-text',
    tableFields: ['id', 'title', 'slug', 'status', 'date_updated'],
    queryOptions: {
      sortField: 'title',
      sortDirection: 'asc'
    },
    formFields: [
      {
        name: 'title',
        label: 'Page Title',
        type: 'text',
        required: true,
        helpText: 'The title of the page',
        maxLength: 100
      },
      {
        name: 'slug',
        label: 'URL Slug',
        type: 'text',
        required: true,
        helpText: 'The URL-friendly identifier (e.g., "about-us")',
        maxLength: 100
      },
      {
        name: 'seo_title_tag',
        label: 'SEO Title Tag',
        type: 'text',
        required: false,
        helpText: 'The title tag for SEO: "Keyword-1 | Keyword-2 | Keyword-3". " | Commons Hub" is added automatically.',
        maxLength: 60
      },
      {
        name: 'seo_description',
        label: 'SEO Description',
        type: 'textarea',
        required: false,
        helpText: 'The description for SEO',
        rows: 3,
        maxLength: 160
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      {
        name: 'body',
        label: 'Page Content',
        type: 'richtext',
        required: false,
        helpText: 'The main content of the page',
        rows: 10
      },
      {
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        required: false,
        helpText: 'A brief summary of the page content',
        rows: 3,
        maxLength: 500
      },
      {
        name: 'is_homepage',
        label: 'Homepage',
        type: 'boolean',
        required: false,
        helpText: 'Set as the homepage'
      },
      {
        name: 'main_image',
        label: 'Main Image',
        type: 'image',
        required: false,
        helpText: 'The main image for this page'
      },
      {
        name: 'main_icon',
        label: 'Main Icon',
        type: 'image',
        required: false,
        helpText: 'The main icon for this page'
      },
      {
        name: 'page_category',
        label: 'Page Category',
        type: 'relation_m-m',
        relatedTable: 'categories',
        junctionTable: 'page_category',
        foreignKey: 'page_id',
        relatedKey: 'category_id',
        displayFields: ['title'],
        titleFields: ['title'],
        sortField: 'title',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The category of the page'
      },
      {
        name: 'accordions',
        label: 'Accordions',
        type: 'relation_m-m',
        relatedTable: 'accordions',
        junctionTable: 'page_accordion',
        foreignKey: 'page_id',
        relatedKey: 'accordion_id',
        displayFields: ['name_not_used'],
        titleFields: ['name_not_used'],
        sortField: 'name_not_used',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The accordions of the page'
      },
      {
        name: 'carousels',
        label: 'Carousels',
        type: 'relation_m-m',
        relatedTable: 'carousels',
        junctionTable: 'page_carousel',
        foreignKey: 'page_id',
        relatedKey: 'carousel_id',
        displayFields: ['title'],
        titleFields: ['title'],
        sortField: 'title',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The carousels of the page'
      },
      {
        name: 'posts',
        label: 'Posts',
        type: 'relation_m-m',
        relatedTable: 'posts',
        junctionTable: 'page_post',
        foreignKey: 'page_id',
        relatedKey: 'post_id',
        displayFields: ['title'],
        titleFields: ['title'],
        sortField: 'title',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The posts of the page'
      }
    ],
    viewable: true,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },

  categories: {
    displayName: 'Categories',
    description: 'Content categories',
    icon: 'tag',
    tableFields: ['id', 'title', 'slug', 'status', 'date_updated'],
    queryOptions: {
      sortField: 'title',
      sortDirection: 'asc'
    },
    formFields: [
      {
        name: 'title',
        label: 'Category Name',
        type: 'text',
        required: true,
        helpText: 'The name of the category'
      },
      {
        name: 'slug',
        label: 'URL Slug',
        type: 'text',
        required: true,
        helpText: 'The URL-friendly identifier (e.g., "news")',
      },
      {
        name: 'seo_title_tag',
        label: 'SEO Title Tag',
        type: 'text',
        required: false,
        helpText: 'The title tag for SEO: "Keyword-1 | Keyword-2 | Keyword-3". " | Commons Hub" is added automatically.',
        maxLength: 60
      },
      {
        name: 'seo_description',
        label: 'SEO Description',
        type: 'textarea',
        required: false,
        helpText: 'The description for SEO',
        rows: 3,
        maxLength: 160
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      {
        name: 'body',
        label: 'Description',
        type: 'richtext',
        required: false,
        helpText: 'A description of the category',
        rows: 5
      },
      {
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        required: false,
        helpText: 'A brief summary of the category',
        rows: 2
      },
      {
        name: 'sort',
        label: 'Sort Order',
        type: 'number',
        required: false,
        helpText: 'Order in which the category appears in listings'
      },
      {
        name: 'main_image',
        label: 'Main Image',
        type: 'image',
        required: false,
        helpText: 'The main image for this page'
      },
      {
        name: 'main_icon',
        label: 'Main Icon',
        type: 'image',
        required: false,
        helpText: 'The main icon for this page'
      },
      {
        name: 'accordions',
        label: 'Accordions',
        type: 'relation_m-m',
        relatedTable: 'accordions',
        junctionTable: 'category_accordion',
        foreignKey: 'category_id',
        relatedKey: 'accordion_id',
        displayFields: ['name_not_used'],
        titleFields: ['name_not_used'],
        sortField: 'name_not_used',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The accordions of the page'
      },
      {
        name: 'carousels',
        label: 'Carousels',
        type: 'relation_m-m',
        relatedTable: 'carousels',
        junctionTable: 'category_carousel',
        foreignKey: 'category_id',
        relatedKey: 'carousel_id',
        displayFields: ['title'],
        titleFields: ['title'],
        sortField: 'title',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The carousels of the page'
      },
      {
        name: 'posts',
        label: 'Posts',
        type: 'relation_m-m',
        relatedTable: 'posts',
        junctionTable: 'category_post',
        foreignKey: 'category_id',
        relatedKey: 'post_id',
        displayFields: ['title'],
        titleFields: ['title'],
        sortField: 'title',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The posts of the page'
      }
    ],
    viewable: true,
    editable: true,
    deletable: true,
    searchMode: 'server'
  },
  posts: {
    displayName: 'Posts',
    description: 'Blog posts and news items',
    icon: 'newspaper',
    tableFields: ['id', 'title', 'slug', 'status', 'date_created'],
    queryOptions: {
      sortField: 'date_created',
      sortDirection: 'desc'
    },
    formFields: [
      {
        name: 'title',
        label: 'Post Title',
        type: 'text',
        required: true,
        helpText: 'The title of the post'
      },
      {
        name: 'slug',
        label: 'URL Slug',
        type: 'text',
        required: true,
        helpText: 'The URL-friendly identifier (e.g., "my-blog-post")'
      },
      {
        name: 'seo_title_tag',
        label: 'SEO Title Tag',
        type: 'text',
        required: false,
        helpText: 'The title tag for SEO: "Keyword-1 | Keyword-2 | Keyword-3". " | Commons Hub" is added automatically.',
        maxLength: 60
      },
      {
        name: 'seo_description',
        label: 'SEO Description',
        type: 'textarea',
        required: false,
        helpText: 'The description for SEO',
        rows: 3,
        maxLength: 160
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      {
        name: 'valid_to',
        label: 'Valid To',
        type: 'date',
        required: true,
        helpText: 'The date when the post is no longer valid'
      },
      {
        name: 'body',
        label: 'Post Content',
        type: 'richtext',
        required: false,
        helpText: 'The main content of the post',
        rows: 10
      },
      {
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        required: false,
        helpText: 'A brief summary of the post',
        rows: 3
      },
      {
        name: 'main_image',
        label: 'Main Image',
        type: 'image',
        required: false,
        helpText: 'The main image for this page'
      },
      {
        name: 'main_icon',
        label: 'Main Icon',
        type: 'image',
        required: false,
        helpText: 'The main icon for this page'
      },      
      {
        name: 'accordions',
        label: 'Accordions',
        type: 'relation_m-m',
        relatedTable: 'accordions',
        junctionTable: 'post_accordion',
        foreignKey: 'post_id',
        relatedKey: 'accordion_id',
        displayFields: ['name_not_used'],
        titleFields: ['name_not_used'],
        sortField: 'name_not_used',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The accordions of the page'
      },
      {
        name: 'carousels',
        label: 'Carousels',
        type: 'relation_m-m',
        relatedTable: 'carousels',
        junctionTable: 'post_carousel',
        foreignKey: 'post_id',
        relatedKey: 'carousel_id',
        displayFields: ['title'],
        titleFields: ['title'],
        sortField: 'title',
        sortDirection: 'asc',
        limit: 100,
        required: false,
        helpText: 'The carousels of the page'
      },
      {
        name: 'related_items',
        label: 'Related Items',
        type: 'related_items',
        relatedTable: 'progressbar',
        foreignKey: 'post_id',
        displayFields: ['title', 'currentValue', 'targetValue'],
        titleFields: ['title'],
        sortField: 'sort',
        sortDirection: 'asc',
        limit: 10
      }
    ],
    viewable: true,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },

  carousels: {
    displayName: 'Carousels',
    description: 'Carousels and their content',
    icon: 'file-text',
    tableFields: ['title', 'status'],
    queryOptions: {
      sortField: 'title',
      sortDirection: 'asc'
    },
    formFields: [
      {
        name: 'title',
        label: 'Carousel Title',
        type: 'text',
        required: true,
        helpText: 'The title of the carousel'
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      {
        name: 'related_items',
        label: 'Related Items',
        type: 'related_items',
        relatedTable: 'carousel_items',
        foreignKey: 'carousel_id',
        displayFields: ['quote', 'image', 'button_link', 'button_text'],
        titleFields: ['quote'],
        sortField: 'sort',
        sortDirection: 'asc',
        limit: 10
      }
    ],
    viewable: true,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },

  carousel_items: {
    displayName: 'Carousel Items',
    description: 'Carousel items and their content',
    icon: 'file-text',
    tableFields: ['carousel_id', 'quote', 'image', 'button_link', 'button_text', 'status'],
    queryOptions: {
      sortField: 'quote',
      sortDirection: 'asc'
    },
    formFields: [
      {
        name: 'quote',
        label: 'Quote',
        type: 'richtext',
        required: true,
        helpText: 'The quote of the carousel item'
      },
      {
        name: 'image',
        label: 'Image',
        type: 'image',
        required: true,
        helpText: 'The image of the carousel item'
      },
      {
        name: 'button_link',
        label: 'Button Link',
        type: 'text',
        required: false,
        helpText: 'The link of the button of the carousel item'
      }
    ],
    viewable: false,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },
  accordions: {
    displayName: 'Accordions',
    description: 'Accordions and their content',
    icon: 'layers',
    tableFields: ['name_not_used', 'status'],
    queryOptions: {
      sortField: 'name_not_used',
      sortDirection: 'asc'
    },
    formFields: [
      {
        name: 'name_not_used',
        label: 'Accordion Name',
        type: 'text',
        required: true,
        helpText: 'This name is not used in the frontend'
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      {
        name: 'related_items',
        label: 'Accordion Items',
        type: 'related_items',
        relatedTable: 'accordion_items',
        foreignKey: 'accordion_id',
        displayFields: ['header', 'content', 'main_image'],
        titleFields: ['header'],
        sortField: 'sort',
        sortDirection: 'asc',
        limit: 20
      }
    ],
    viewable: true,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },

  accordion_items: {
    displayName: 'Accordion Items',
    description: 'Individual accordion items with content',
    icon: 'layers-2',
    tableFields: ['header', 'accordion_id', 'sort'],
    queryOptions: {
      sortField: 'sort',
      sortDirection: 'asc'
    },
    formFields: [
      {
        name: 'header',
        label: 'Header',
        type: 'text',
        required: true,
        helpText: 'The header/title of the accordion item'
      },
      {
        name: 'content',
        label: 'Content',
        type: 'richtext',
        required: true,
        helpText: 'The content of the accordion item',
        rows: 5
      },
      {
        name: 'main_image',
        label: 'Image',
        type: 'image',
        required: false,
        helpText: 'Optional image for the accordion item'
      },
      {
        name: 'sort',
        label: 'Sort Order',
        type: 'number',
        required: false,
        helpText: 'Order in which the item appears in the accordion'
      }
    ],
    viewable: false,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },
  eventpages: {
    displayName: 'Event Pages',
    description: 'Event pages and their content',
    icon: 'calendar',
    tableFields: ['id', 'title', 'slug', 'status', 'startdatetime', 'enddatetime', 'date_updated'],
    queryOptions: {
      sortField: 'startdatetime',
      sortDirection: 'desc'
    },
    formFields: [
      {
        name: 'title',
        label: 'Event Title',
        type: 'text',
        required: true,
        helpText: 'The title of the event',
        maxLength: 100
      },
      {
        name: 'slug',
        label: 'URL Slug',
        type: 'text',
        required: true,
        helpText: 'The URL-friendly identifier (e.g., "summer-festival-2025")',
        maxLength: 100
      },
      {
        name: 'seo_title_tag',
        label: 'SEO Title Tag',
        type: 'text',
        required: false,
        helpText: 'The title tag for SEO: "Keyword-1 | Keyword-2 | Keyword-3". " | Commons Hub" is added automatically.',
        maxLength: 60
      },
      {
        name: 'seo_description',
        label: 'SEO Description',
        type: 'textarea',
        required: false,
        helpText: 'The description for SEO',
        rows: 3,
        maxLength: 160
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      {
        name: 'startdatetime',
        label: 'Start Date & Time',
        type: 'datetime',
        required: true,
        helpText: 'When the event starts'
      },
      {
        name: 'enddatetime',
        label: 'End Date & Time',
        type: 'datetime',
        required: false,
        helpText: 'When the event ends'
      },
      {
        name: 'body',
        label: 'Event Content',
        type: 'richtext',
        required: false,
        helpText: 'The main content of the event page',
        rows: 10
      },
      {
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        required: false,
        helpText: 'A brief summary of the event',
        rows: 3,
        maxLength: 500
      },
      {
        name: 'main_image',
        label: 'Main Image',
        type: 'image',
        required: false,
        helpText: 'The main image for this event'
      },
      {
        name: 'main_icon',
        label: 'Main Icon',
        type: 'image',
        required: false,
        helpText: 'The main icon for this event'
      }
    ],
    viewable: true,
    editable: true,
    deletable: true,
    searchMode: 'client'
  },
  progressbar: {
    displayName: 'Progress Bar',
    description: 'Configure fundraising progress bars shown on posts/pages',
    icon: 'gauge',
    tableFields: ['id', 'title', 'currentValue', 'targetValue'],
    queryOptions: {
      sortField: 'id',
      sortDirection: 'desc'
    },
    formFields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        helpText: 'Short label shown above the progress bar'
      },
      {
        name: 'currentValue',
        label: 'Current Value',
        type: 'number',
        required: true,
        helpText: 'Current amount reached (number)'
      },
      {
        name: 'targetValue',
        label: 'Target Value',
        type: 'number',
        required: true,
        helpText: 'Target amount (number)'
      },
      {
        name: 'threshold1',
        label: 'Threshold 1',
        type: 'number',
        required: true,
        helpText: 'First threshold value used for coloring'
      },
      {
        name: 'threshold2',
        label: 'Threshold 2',
        type: 'number',
        required: true,
        helpText: 'Second threshold value used for coloring'
      },
      {
        name: 'label1',
        label: 'Label 1',
        type: 'text',
        required: true,
        helpText: 'Label displayed near threshold 1'
      },
      {
        name: 'label2',
        label: 'Label 2',
        type: 'text',
        required: true,
        helpText: 'Label displayed near threshold 2'
      },
      {
        name: 'label3',
        label: 'Label 3',
        type: 'text',
        required: true,
        helpText: 'Label displayed near the target'
      }
    ],
    viewable: false,
    editable: true,
    deletable: true,
    searchMode: 'client'
  }
} as Record<string, TableConfig>;

/**
 * Get list of tables that are viewable in the admin interface
 */
export function getViewableTables() {
  return Object.entries(tablesConfigs)
    .filter(([, config]) => config.viewable)
    .map(([tableName, config]) => ({
      name: tableName,
      ...config
    }));
}

/**
 * Check if a table is viewable
 */
export function isTableViewable(tableName: string): boolean {
  return tableName in tablesConfigs && tablesConfigs[tableName as keyof typeof tablesConfigs].viewable;
}
