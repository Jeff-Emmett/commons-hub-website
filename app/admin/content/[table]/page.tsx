import { notFound } from 'next/navigation';
import { isTableViewable, tablesConfigs, getRequiredRole } from '../tables.config';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import TableEditorWrapper from '@/components/editor/TableEditorWrapper';
import { Tables } from '@/lib/services/DataTypes';
import { TableConfig } from '@/lib/types/tablesConfigTypes';
import { TableConfigProvider } from '@/lib/contexts/TableConfigContext';

// In Next.js 15, params is a Promise
type Params = Promise<{
  table: string;
}>

export default async function TableEditorPage(props: {
  params: Params
}) {
  // Await the params object directly
  const params = await props.params;
  const { table } = params;
  
  // Check if the table is allowed to be viewed
  if (!isTableViewable(table)) {
    notFound();
  }

  return (
    <TableConfigProvider configs={tablesConfigs as Record<string, TableConfig>}>
      <ProtectedRoute requiredRole={getRequiredRole()}>
        <div className="py-6">
          <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold mb-4">
              {table ? `Create new / Update ${table}` : 'Content Editor'}
            </h1>
          </div>
          <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8">
            <TableEditorWrapper tableName={table as keyof Tables} configs={tablesConfigs as Record<string, TableConfig>} />
          </div>
        </div>
      </ProtectedRoute>
    </TableConfigProvider>
  );
}
