'use client'

import { useCallback, useState, useEffect } from 'react'
import { Brain, Plus, LogOut } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import { createClient } from '@/lib/supabase/client'
import { getInboxPages, getSidebarTree, createPage as createPageService } from '@/services/pageService'
import type { Page, PageNode } from '@/types/page'
import { InboxSection } from './InboxSection'
import { DocumentsSection } from './DocumentsSection'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'


export default function Sidebar() {
  const { selectPage, refreshPages } = usePageContext()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [inboxPages, setInboxPages] = useState<Page[]>([])
  const [folderTree, setFolderTree] = useState<PageNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // 사용자 정보 및 페이지 데이터 가져오기
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // 사용자 정보
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUserEmail(user?.email || null)

        // 페이지 데이터 (pageService 사용)
        const [inbox, tree] = await Promise.all([
          getInboxPages(),
          getSidebarTree(),
        ])
        setInboxPages(inbox)
        setFolderTree(tree)
      } catch (error) {
        console.error('Error loading sidebar data:', error)
        setInboxPages([])
        setFolderTree([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Auth state 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUserEmail(session?.user?.email || null)
      // 로그인/로그아웃 시 데이터 다시 로드
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const [inbox, tree] = await Promise.all([
          getInboxPages(),
          getSidebarTree(),
        ])
        setInboxPages(inbox)
        setFolderTree(tree)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // 로그아웃 핸들러 (보안: 하드 리프레시로 메모리 초기화)
  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert(error.message)
        return
      }
      // window.location.href를 사용하여 하드 리프레시로 페이지 이동
      // 이렇게 하면 클라이언트 상태(Context 등)가 완전히 초기화되어 보안상 안전함
      window.location.href = '/login'
    } catch (error: any) {
      alert(error.message || '로그아웃에 실패했습니다.')
    }
  }, [supabase.auth])

  const handleAddPage = useCallback(async () => {
    try {
      await createPageService({ title: '제목 없음', is_inbox: false })
      // 데이터 새로고침
      const [inbox, tree] = await Promise.all([
        getInboxPages(),
        getSidebarTree(),
      ])
      setInboxPages(inbox)
      setFolderTree(tree)
      await refreshPages() // PageContext도 업데이트
    } catch (error) {
      console.error('Error creating page:', error)
    }
  }, [refreshPages])

  return (
    <aside className="w-[280px] flex flex-col h-full bg-transparent shrink-0">
      <div className="p-5 shrink-0">
        <div className="flex items-center gap-3">
          <Brain size={22} className="text-accent-blue shrink-0" />
          <h2 className="text-lg font-extrabold text-toss-text tracking-tight">EasyBrain</h2>
        </div>
      </div>

      <Separator className="bg-transparent h-px" />

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Inbox Section */}
          <InboxSection pages={inboxPages} isLoading={isLoading} />

          {/* Documents Section */}
          <DocumentsSection tree={folderTree} isLoading={isLoading} />
        </div>
      </ScrollArea>

      <Separator className="bg-transparent h-px" />

      <div className="p-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 rounded-xl py-3 text-[#8B95A1] hover:bg-[rgba(0,0,0,0.04)] hover:text-toss-text font-medium"
          onClick={handleAddPage}
        >
          <Plus size={18} />
          새 페이지 추가
        </Button>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto border-t border-black/5 p-4 shrink-0">
        {userEmail ? (
          <div className="space-y-2">
            <p className="text-xs text-toss-gray truncate">{userEmail}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 rounded-xl py-2 text-[#8B95A1] hover:bg-[rgba(0,0,0,0.04)] hover:text-toss-text text-xs"
            >
              <LogOut size={14} />
              로그아웃
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-toss-gray">로그인 필요</p>
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-xl py-2 text-toss-blue hover:bg-[rgba(0,0,0,0.04)] text-xs"
              >
                로그인
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
