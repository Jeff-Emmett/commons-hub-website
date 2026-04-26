'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

export type UserRole = 'admin' | 'manager' | 'frontdesk' | 'event organiser' | 'event guest'

type ProtectedRouteProps = {
  children: ReactNode
  requiredRole?: UserRole | UserRole[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAdmin, isManager, isFrontdesk, isEventOrganiser, isEventGuest, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    // If no role is required, allow access
    if (!requiredRole) return
    
    // Function to check if user has a specific role
    const hasRole = (role: UserRole): boolean => {
      switch (role) {
        case 'admin': return isAdmin
        case 'manager': return isManager
        case 'frontdesk': return isFrontdesk
        case 'event organiser': return isEventOrganiser
        case 'event guest': return isEventGuest
        default: return false
      }
    }
    
    // Handle both single role and array of roles
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => hasRole(role))
      : hasRole(requiredRole)
    
    if (!hasRequiredRole) {
      // Redirect to appropriate unauthorized page
      const isEventRole = Array.isArray(requiredRole)
        ? requiredRole.includes('event guest')
        : requiredRole === 'event guest'
      
      router.push(isEventRole ? '/eventportal/unauthorized' : '/admin/unauthorized')
    }
  }, [user, isAdmin, isManager, isFrontdesk, isEventOrganiser, loading, router, requiredRole])
  
  if (loading) {
    return <div className="p-4">Loading...</div>
  }
  
  if (!user) {
    return null // Will redirect in useEffect
  }
  
  // If a role is required, check if the user has at least one of the required roles
  if (requiredRole) {
    const hasRole = (role: UserRole): boolean => {
      switch (role) {
        case 'admin': return isAdmin
        case 'manager': return isManager
        case 'frontdesk': return isFrontdesk
        case 'event organiser': return isEventOrganiser
        case 'event guest': return isEventGuest
        default: return false
      }
    }
    
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => hasRole(role))
      : hasRole(requiredRole)
    
    if (!hasRequiredRole) {
      return null // Will redirect in useEffect
    }
  }
  
  return <>{children}</>
}
