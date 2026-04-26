'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TableConfig } from '@/lib/types/tablesConfigTypes';

// Import the UserRole type from the same file as ProtectedRoute
type UserRole = 'admin' | 'manager' | 'frontdesk' | 'event organiser' | 'event guest';

interface TableIndexPageProps {
  title: string;
  viewableTables: Array<{
    name: string;
    displayName: string;
    description?: string;
  } & Partial<TableConfig>>;
  requiredRole?: UserRole | UserRole[];
}

export default function TableIndexPage({ 
  title, 
  viewableTables,
  requiredRole = ['admin', 'manager']
}: TableIndexPageProps) {
  const pathname = usePathname();
  
  // Extract the current section from the pathname
  const currentSection = pathname.split('/').filter(Boolean)[1];

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {viewableTables.map((table) => (
            <Link 
              href={`/admin/${currentSection}/${table.name}`}
              key={table.name}
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">{table.displayName}</h2>
              {table.description && (
                <p className="text-gray-600 mb-4">{table.description}</p>
              )}
              <div className="text-blue-600 hover:text-blue-800">
                View {table.displayName} →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
