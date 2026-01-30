'use client'

import { useState, useEffect, useCallback } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { getTasks, getTask, updateTask, updateTaskPositions } from '@/lib/supabase/tasks'
import type { Task } from '@/lib/supabase/tasks'
import { useReorderHandlers } from '@/contexts/ReorderContext'
import { useFolderContext, folderKey } from '@/contexts/FolderContext'

const INBOX_DROPPABLE_ID = 'inbox'

/** Task 드롭 영역 타입 통일 – 폴더/Inbox/태스크 리스트 모두 이 값과 동일해야 드롭·하이라이트 동작 */
export const TASK_DROPPABLE_TYPE = 'TASK'

interface TaskListProps {
  folderId: string | null
  selectedTaskId: string | null
  onSelectTask: (taskId: string) => void
  /** Depth 3: 폴더 안 태스크 리스트 들여쓰기 (기본 ml-6) */
  indentClassName?: string
}

function getDroppableId(folderId: string | null): string {
  return folderId ?? INBOX_DROPPABLE_ID
}

export default function TaskList({
  folderId,
  selectedTaskId,
  onSelectTask,
  indentClassName = 'ml-6',
}: TaskListProps) {
  const key = folderKey(folderId)
  const { tasksByFolder, setTasksForFolder } = useFolderContext()
  const tasks = tasksByFolder[key]
  const loading = tasks === undefined
  const reorderContext = useReorderHandlers()
  const droppableId = getDroppableId(folderId)

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks(folderId)
      setTasksForFolder(key, data)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setTasksForFolder(key, [])
    }
  }, [folderId, key, setTasksForFolder])

  useEffect(() => {
    if (tasks === undefined) loadTasks()
  }, [key, tasks === undefined, loadTasks])

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const current = tasks ?? []
      if (fromIndex === toIndex) return
      const next = Array.from(current)
      const [removed] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, removed)
      setTasksForFolder(key, next)
      try {
        await updateTaskPositions(folderId, next.map((t) => t.id))
      } catch (error) {
        console.error('Error updating task order:', error)
        loadTasks()
      }
    },
    [tasks, folderId, key, setTasksForFolder, loadTasks]
  )

  const addTaskAt = useCallback(
    async (taskId: string, index: number) => {
      const current = tasks ?? []
      try {
        const task = await getTask(taskId)
        const next = [...current]
        next.splice(index, 0, { ...task, folder_id: folderId, position: index })
        setTasksForFolder(key, next)
        await updateTask(taskId, { folder_id: folderId })
        await updateTaskPositions(folderId, next.map((t) => t.id))
      } catch (error) {
        console.error('Error moving task into folder:', error)
        loadTasks()
      }
    },
    [tasks, folderId, key, setTasksForFolder, loadTasks]
  )

  const removeTask = useCallback(
    async (taskId: string) => {
      const current = tasks ?? []
      const next = current.filter((t) => t.id !== taskId)
      setTasksForFolder(key, next)
      try {
        await updateTaskPositions(folderId, next.map((t) => t.id))
      } catch (error) {
        console.error('Error removing task from list:', error)
        loadTasks()
      }
    },
    [tasks, folderId, key, setTasksForFolder, loadTasks]
  )

  useEffect(() => {
    if (!reorderContext) return
    reorderContext.register(droppableId, {
      folderId,
      reorder: handleReorder,
      addTaskAt,
      removeTask,
    })
    return () => {
      reorderContext.unregister(droppableId)
    }
  }, [droppableId, folderId, handleReorder, addTaskAt, removeTask, reorderContext])

  if (loading || tasks === undefined) {
    return (
      <div className={`${indentClassName} px-2 py-1 text-xs text-slate-500`}>
        로딩 중...
      </div>
    )
  }

  return (
    <Droppable droppableId={droppableId} type={TASK_DROPPABLE_TYPE} isDropDisabled={false}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${indentClassName} mt-1 space-y-0.5 min-h-[32px] rounded-lg transition-colors ${
            snapshot.isDraggingOver
              ? 'bg-slate-200/90 ring-1 ring-slate-300 ring-inset'
              : 'bg-transparent'
          } ${tasks.length === 0 ? 'py-2 px-2' : ''}`}
        >
          {tasks.length === 0 && (
            <div
              className={`text-xs text-slate-400 text-center py-2 rounded ${
                snapshot.isDraggingOver ? 'text-slate-600' : ''
              }`}
            >
              Drop here
            </div>
          )}
          {tasks.map((task, index) => {
            const isSelected = selectedTaskId === task.id

            return (
              <Draggable key={task.id} draggableId={task.id} index={index} type={TASK_DROPPABLE_TYPE}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                      snapshot.isDragging ? 'opacity-90 shadow-md bg-white border border-slate-200' : ''
                    } ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-medium'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    onClick={() => onSelectTask(task.id)}
                  >
                    <div className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 shrink-0 text-slate-500"
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
                    <span className="flex-1 text-xs truncate">
                      {task.title || '제목 없음'}
                    </span>
                  </div>
                )}
              </Draggable>
            )
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
