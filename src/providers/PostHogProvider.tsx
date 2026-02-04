// src/providers/PostHogProvider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        capture_pageview: false, // Next.js에서는 수동으로 처리하는 게 정확함 (일단 false)
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug() // 개발 모드에서 로그 확인
        }
      })
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}