'use client'

import { ReactNode } from 'react'
import { AuthProvider as AuthContextProvider } from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthContextProvider>{children}</AuthContextProvider>
}
