'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFolders, createFolder, deleteFolder } from '@/lib/supabase/categories-folders'
import type { Folder } from '@/types/category-folder.types'
import TaskList from './TaskList'

interface FolderTreeProps {
  parentId: string | null
  categoryId: string | null
  level?: number
  selectedFolderId: string | null
  selectedTaskId: string | null
  onSelectFolder: (folderId: string | null, folderName: string | null) => void
  onSelectTask: (taskId: string) => void
  onRefresh?: () => void
}

export default function FolderTree({
  parentId,
  categoryId,
  level = 0,
  selectedFolderId,
  selectedTaskId,
  onSelectFolder,
  onSelectTask,
  onRefresh,
}: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadFolders()
  }, [parentId, categoryId])

  const loadFolders = async () => {
    const data = await getFolders(categoryId, parentId)
    setFolders(data)
  }

  const toggleExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    try {
      const folder = await createFolder(newFolderName.trim(), categoryId, parentId)
      setNewFolderName('')
      setIsCreating(false)
      await loadFolders()
      if (onRefresh) onRefresh()
      // 새로 생성된 폴더를 자동으로 선택
      onSelectFolder(folder.id, folder.name)
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('폴더 생성에 실패했습니다.')
    }
  }

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('이 폴더를 삭제하시겠습니까?')) return

    try {
      await deleteFolder(folderId)
      await loadFolders()
      if (onRefresh) onRefresh()
      if (selectedFolderId === folderId) {
        onSelectFolder(null, null)
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('폴더 삭제에 실패했습니다.')
    }
  }

  if (folders.length === 0 && !isCreating && level === 0) {
    return null
  }

  return (
    <div className={`${level > 0 ? 'ml-4' : ''}`}>
      {folders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id)
        const isSelected = selectedFolderId === folder.id

        return (
          <div key={folder.id} className="select-none">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer group ${
                isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''
              }`}
              onClick={() => {
                toggleExpand(folder.id)
                onSelectFolder(folder.id, folder.name)
              }}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {/* 폴더 아이콘 */}
              <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-4l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                )}
              </div>

              {/* 폴더 이름 */}
              <span
                className={`flex-1 text-sm truncate ${
                  isSelected
                    ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {folder.name}
              </span>

              {/* 하위 폴더 추가 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCreating(true)
                }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                title="하위 폴더 추가"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => handleDeleteFolder(folder.id, e)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded"
                title="삭제"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            {/* 하위 폴더 트리 (재귀) */}
            {isExpanded && (
              <FolderTree
                parentId={folder.id}
                categoryId={null}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                selectedTaskId={selectedTaskId}
                onSelectFolder={onSelectFolder}
                onSelectTask={onSelectTask}
                onRefresh={loadFolders}
              />
            )}
            
            {/* 현재 폴더의 Task 목록 (폴더가 선택되었거나 펼쳐져 있을 때 표시) */}
            {(isSelected || isExpanded) && (
              <TaskList
                folderId={folder.id}
                selectedTaskId={selectedTaskId}
                onSelectTask={onSelectTask}
              />
            )}
          </div>
        )
      })}

      {/* 새 폴더 생성 폼 */}
      {isCreating && (
        <form
          onSubmit={handleCreateFolder}
          className="px-2 py-1"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="폴더 이름"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
              onBlur={() => {
                if (!newFolderName.trim()) {
                  setIsCreating(false)
                }
              }}
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false)
                setNewFolderName('')
              }}
              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
