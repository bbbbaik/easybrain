'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageProvider, usePageContext } from '@/contexts/PageContext'
import Sidebar from '@/components/Sidebar'
import PageEditor from '@/components/PageEditor'

function MainContent() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-background">
      <PageEditor />
    </main>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<unknown>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) {
          router.replace('/login')
          return
        }
        setUser(u)
      } catch (error) {
        console.error('Error checking user:', error)
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.replace('/login')
      else if (event === 'SIGNED_IN' && session) setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <PageProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </PageProvider>
  )
}
