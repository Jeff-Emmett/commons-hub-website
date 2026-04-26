'use client'

import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { usePathname } from "next/navigation"

export function AdminButton() {
  const { isAdmin, isManager, isFrontdesk, loading } = useAuth()
  const pathname = usePathname()
  
  if (loading) {
    return null // Don't show anything while loading
  }
  
  // Only show buttons for users with appropriate roles
  if (isAdmin || isManager || isFrontdesk) {
    // Check if current path is in admin section
    const isAdminPage = pathname?.startsWith('/admin')
    
    if (isAdminPage) {
      // Show link to public page when in admin section
      return (
        <Link 
          href="/" 
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors ml-2"
        >
          Public Page
        </Link>
      )
    } else {
      // Show link to admin dashboard when not in admin section
      return (
        <Link 
          href="/admin" 
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors ml-2"
        >
          Admin Dashboard
        </Link>
      )
    }
  }
  
  // Return null if user doesn't have appropriate roles
  return null
}
