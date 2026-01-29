'use client'

import { useState, useEffect } from 'react'
import { getCategories, getFolders, createCategory, deleteCategory } from '@/lib/supabase/categories-folders'
import FolderTree from './FolderTree'
import TaskList from './TaskList'
import type { Category, Folder } from '@/types/category-folder.types'

interface CategoryTreeProps {
  selectedFolderId: string | null
  selectedTaskId: string | null
  onSelectFolder: (folderId: string | null, folderName: string | null) => void
  onSelectTask: (taskId: string) => void
}

export default function CategoryTree({
  selectedFolderId,
  selectedTaskId,
  onSelectFolder,
  onSelectTask,
}: CategoryTreeProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      await createCategory(newCategoryName.trim())
      setNewCategoryName('')
      setIsCreatingCategory(false)
      await loadCategories()
    } catch (error: any) {
      console.error('Error creating category:', error)
      alert(error.message || '카테고리 생성에 실패했습니다.')
    }
  }

  const handleDeleteCategory = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('이 카테고리를 삭제하시겠습니까? (하위 폴더도 모두 삭제됩니다)')) return

    try {
      await deleteCategory(categoryId)
      await loadCategories()
      onSelectFolder(null, null)
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('카테고리 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* 카테고리 목록 */}
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id)

        return (
          <div key={category.id} className="select-none">
            {/* 카테고리 헤더 */}
            <div
              className="flex items-center gap-1 px-2 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer group font-medium"
              onClick={() => toggleCategory(category.id)}
            >
              {/* 카테고리 아이콘 */}
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
                      d="M19 9l-7 7-7-7"
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>

              {/* 카테고리 이름 */}
              <span
                className="flex-1 text-sm truncate text-gray-900 dark:text-white"
                style={category.color ? { color: category.color } : {}}
              >
                {category.name}
              </span>

              {/* 하위 폴더 추가 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // 카테고리 하위에 폴더 추가는 FolderTree에서 처리
                  if (!isExpanded) {
                    toggleCategory(category.id)
                  }
                }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                title="폴더 추가"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => handleDeleteCategory(category.id, e)}
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

            {/* 폴더 트리 (카테고리가 펼쳐져 있을 때만 표시) */}
            {isExpanded && (
              <div className="ml-2">
                <FolderTree
                  parentId={null}
                  categoryId={category.id}
                  level={0}
                  selectedFolderId={selectedFolderId}
                  selectedTaskId={selectedTaskId}
                  onSelectFolder={onSelectFolder}
                  onSelectTask={onSelectTask}
                  onRefresh={loadCategories}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* 새 카테고리 생성 폼 */}
      {isCreatingCategory ? (
        <form onSubmit={handleCreateCategory} className="px-2 py-2">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="카테고리 이름"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
              onBlur={() => {
                if (!newCategoryName.trim()) {
                  setIsCreatingCategory(false)
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
                setIsCreatingCategory(false)
                setNewCategoryName('')
              }}
              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsCreatingCategory(true)}
          className="w-full px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          카테고리 추가
        </button>
      )}
    </div>
  )
}
