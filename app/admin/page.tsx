'use client'

import { useAuth } from '@/lib/auth/AuthContext'


export default function AdminDashboard() {
  const { user, userRole } = useAuth()

    
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.email?.split('@')[0] || 'User'}! You are logged in as <span className="font-semibold">{userRole}</span>.
        </p>
      </div>
    </div>
  )
}
