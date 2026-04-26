'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { jwtDecode } from 'jwt-decode'
import { User, Session } from '@supabase/supabase-js'

// Define the shape of our auth context
export interface AuthContextState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isFrontdesk: boolean;
  isEventOrganiser: boolean;
  isEventGuest: boolean;
  loading: boolean;
  error: Error | null;
}

// Create the context with default values
const AuthContext = createContext<AuthContextState>({
  user: null,
  session: null,
  userRole: null,
  isAdmin: false,
  isManager: false,
  isFrontdesk: false,
  isEventOrganiser: false,
  isEventGuest: false,
  loading: true,
  error: null
})

// Props for the AuthProvider component
type AuthProviderProps = {
  children: ReactNode
}

// Create the AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthContextState>({
    user: null,
    session: null,
    userRole: null,
    isAdmin: false,
    isManager: false,
    isFrontdesk: false,
    isEventOrganiser: false,
    isEventGuest: false,
    loading: true,
    error: null
  })
  
  useEffect(() => {
    const supabase = createClient()
    
    // Function to update state based on session
    const updateStateFromSession = (session: Session | null) => {
      if (!session) {
        setState({
          user: null,
          session: null,
          userRole: null,
          isAdmin: false,
          isManager: false,
          isFrontdesk: false,
          isEventOrganiser: false,
          isEventGuest: false,
          loading: false,
          error: null
        })
        return
      }
      
      try {
        // Decode JWT to get user role
        const jwt = jwtDecode<{ user_role?: string }>(session.access_token)
        const userRole = jwt.user_role || null
        
        // Apply role hierarchy: admin > manager > frontdesk/event organiser > event guest
        const isAdmin = userRole === 'admin';
        const isManager = userRole === 'manager' || isAdmin;
        const isFrontdesk = userRole === 'frontdesk' || isManager;
        const isEventOrganiser = userRole === 'event organiser' || isManager;
        const isEventGuest = userRole === 'event guest' || isEventOrganiser || isManager;
        
        setState({
          user: session.user,
          session,
          userRole,
          isAdmin,
          isManager,
          isFrontdesk,
          isEventOrganiser,
          isEventGuest,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error decoding JWT:', error)
        setState({
          user: session.user,
          session,
          userRole: null,
          isAdmin: false,
          isManager: false,
          isFrontdesk: false,
          isEventOrganiser: false,
          isEventGuest: false,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    }
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        updateStateFromSession(data.session)
      } catch (error) {
        console.error('Error getting auth session:', error)
        setState((prev: AuthContextState) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error))
        }))
      }
    }
    
    // Initialize auth state
    initializeAuth()
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        updateStateFromSession(session)
      }
    )
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
