'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const { user, userRole } = useAuth()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-gray-700">
              You don&apos;t have permission to access this page.
            </p>
            {user && userRole && (
              <p className="mt-2 text-sm text-gray-600">
                Your current role: <span className="font-semibold">{userRole}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link 
              href="/admin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Go to Dashboard
            </Link>
            
            <Link
              href="/"
              className="inline-block text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
