'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import PageEditor from '@/components/PageEditor'

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
      <div className="min-h-screen flex items-center justify-center bg-toss-base">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-toss-blue border-t-transparent" />
          <p className="mt-4 text-toss-gray">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-toss-base p-6">
      <Sidebar />
      <div className="flex-1 flex min-w-0 overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col bg-card rounded-3xl shadow-sm overflow-hidden">
          <PageEditor />
        </div>
      </div>
    </div>
  )
}
