"use client";

import Link from 'next/link'
import React from 'react'

function ClientSideRout({ children, route, ariaLabel }: { children: React.ReactNode; route: string; ariaLabel?: string }) {
  return (
    <Link href={route} aria-label={ariaLabel} role="link">{children}</Link>
  )
}

export default ClientSideRout