'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import PageEditor from '@/components/PageEditor'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<unknown>(null)
  const router = useRouter()
  
  // Supabase 클라이언트를 useRef로 한 번만 생성 (무한 루프 방지)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]) // router만 dependency에 포함 (supabase는 useRef로 안정적)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-toss-blue border-t-transparent" />
          <p className="mt-4 text-toss-gray">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col pt-6 pr-6 pb-6 pl-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[24px] shadow-sm overflow-y-auto h-[calc(100vh-48px)]">
          <PageEditor />
        </div>
      </div>
    </div>
  )
}
