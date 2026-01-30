'use client'

import { PageProvider } from '@/contexts/PageContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return <PageProvider>{children}</PageProvider>
}
