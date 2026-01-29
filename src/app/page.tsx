'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FolderProvider, useFolderContext } from '@/contexts/FolderContext'
import Sidebar from '@/components/Sidebar'
import TaskEditor from '@/components/TaskEditor'

// 메인 컨텐츠 영역 (폴더 컨텍스트 사용)
function MainContent({ user }: { user: any }) {
  const { selectedFolderId, selectedFolderName } = useFolderContext()

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* 선택된 폴더 표시 */}
      {selectedFolderId && selectedFolderName && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
          <p className="text-sm text-indigo-700 dark:text-indigo-400">
            📂 <strong>{selectedFolderName}</strong> 폴더
          </p>
        </div>
      )}
      
      {/* Task 에디터 */}
      <TaskEditor />
    </main>
  )
}

// 메인 대시보드 페이지 (클라이언트 컴포넌트)
// - 브라우저 단에서 세션 체크 및 Auth Guard 처리
export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // 유저가 없으면 로그인 페이지로 리다이렉트
          router.replace('/login')
          return
        }

        // 유저가 있으면 상태 업데이트
        setUser(user)
      } catch (error) {
        console.error('Error checking user:', error)
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Auth state 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login')
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 유저가 없으면 (리다이렉트 중이므로 이 부분은 보통 보이지 않음)
  if (!user) {
    return null
  }

  // 로그인된 경우 - 정상 대시보드 표시
  // FolderProvider로 Sidebar와 MainContent를 모두 감싸서 Context 공유
  return (
    <FolderProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MainContent user={user} />
      </div>
    </FolderProvider>
  )
}
