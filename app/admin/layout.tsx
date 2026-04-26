'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getViewableTables as getContentViewableTables, getRequiredRole as getContentRequiredRole } from './content/tables.config'
// import { getViewableTables as getAdministrationViewableTables, getRequiredRole as getAdministrationRequiredRole } from './administration/tables.config'
// import { getViewableTables as getBookingsViewableTables, getRequiredRole as getBookingsRequiredRole } from './bookings/tables.config'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const { userRole, user, isEventOrganiser, isManager, isAdmin, isFrontdesk } = useAuth()
  const { userRole } = useAuth()
  const pathname = usePathname()
  const contentViewableTables = getContentViewableTables()
  const contentRequiredRole = getContentRequiredRole()
  // const administrationViewableTables = getAdministrationViewableTables()
  // const administrationRequiredRole = getAdministrationRequiredRole()
  // const bookingsViewableTables = getBookingsViewableTables()
  // const bookingsRequiredRole = getBookingsRequiredRole()
  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
  }
 
  return (
    <ProtectedRoute requiredRole="frontdesk">
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-md min-h-screen p-4">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-gray-800">Admin Portal</h1>
              <p className="text-sm text-gray-500">Role: {userRole || 'Loading...'}</p>
            </div>
            
            <nav className="space-y-1">
              <Link 
                href="/admin" 
                className={`block px-4 py-2 rounded-md text-sm ${isActive('/admin')}`}
              >
                Admin Dashboard
              </Link>


              
              {/* Content Management section - based on required role */}
              {contentRequiredRole.some(role => userRole === role as string) && (
                <>
                  <div className="pt-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Content Management
                    </div>
                  </div>
                                    
                  <div className="mt-2 space-y-1">
                    <Link 
                      href={`/admin/content`} 
                      className={`block px-4 py-2 rounded-md text-sm ${isActive('/admin/content')}`}
                    >
                      Content Dashboard
                    </Link>
                    
                    {/* Dynamically generate links for all viewable tables */}
                    {contentViewableTables.map(table => (
                      <Link 
                        key={table.name}
                        href={`/admin/content/${table.name}`} 
                        className={`block px-4 py-2 rounded-md text-sm ${pathname === `/admin/content/${table.name}` ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                      >
                        {table.displayName}
                      </Link>
                    ))}                  
                  </div>
                </>
              )}
            </nav>
          </div>
          
          {/* Main content */}
          <div className="flex-1 p-8">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
