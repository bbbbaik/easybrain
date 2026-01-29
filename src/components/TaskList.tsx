'use client'

import { useState, useEffect } from 'react'
import { getTasks } from '@/lib/supabase/tasks'
import type { Task } from '@/lib/supabase/tasks'

interface TaskListProps {
  folderId: string | null
  selectedTaskId: string | null
  onSelectTask: (taskId: string) => void
}

export default function TaskList({ folderId, selectedTaskId, onSelectTask }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [folderId])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const data = await getTasks(folderId)
      setTasks(data)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
        로딩 중...
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
        Task가 없습니다
      </div>
    )
  }

  return (
    <div className="ml-2 mt-1 space-y-0.5">
      {tasks.map((task) => {
        const isSelected = selectedTaskId === task.id

        return (
          <div
            key={task.id}
            className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer group hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''
            }`}
            onClick={() => onSelectTask(task.id)}
          >
            {/* 문서 아이콘 */}
            <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            {/* Task 제목 */}
            <span
              className={`flex-1 text-xs truncate ${
                isSelected
                  ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {task.title || '제목 없음'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
