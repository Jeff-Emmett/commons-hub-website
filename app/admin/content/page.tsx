'use client';

import { getViewableTables, getRequiredRole } from './tables.config';
import TableIndexPage from '@/components/admin/TableIndexPage';

export default function ContentIndexPage() {
  const viewableTables = getViewableTables();
  const requiredRole = getRequiredRole();

  return (
    <TableIndexPage
      title="Content Management"
      viewableTables={viewableTables}
      requiredRole={requiredRole}
    />
  );
}
