'use client'

import { Suspense } from 'react'
import { AdminButton } from './admin-button'

export function AdminButtonWrapper() {
  return (
    <Suspense fallback={null}>
      <AdminButton />
    </Suspense>
  )
}
