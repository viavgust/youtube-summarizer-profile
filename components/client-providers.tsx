'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { type ReactNode, Suspense } from 'react'

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </Suspense>
  )
}
