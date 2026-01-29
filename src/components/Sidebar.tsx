'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useFolderContext } from '@/contexts/FolderContext'
import CategoryTree from './CategoryTree'
import TaskList from './TaskList'

export default function Sidebar() {
  const [user, setUser] = useState<any>(null)
  const { selectedFolderId, setSelectedFolder, selectedTaskId, setSelectedTaskId } = useFolderContext()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleSelectFolder = (folderId: string | null, folderName: string | null) => {
    setSelectedFolder(folderId, folderName)
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">EasyBrain</h2>
        {user && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            카테고리 & 폴더
          </h3>
          <CategoryTree
            selectedFolderId={selectedFolderId}
            selectedTaskId={selectedTaskId}
            onSelectFolder={handleSelectFolder}
            onSelectTask={handleSelectTask}
          />
        </div>
        {/* Inbox (folder_id가 null인 Task들) */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Inbox
          </h3>
          <TaskList
            folderId={null}
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
          />
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          로그아웃
        </button>
      </div>
    </aside>
  )
}
