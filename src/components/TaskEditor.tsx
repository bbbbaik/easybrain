'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useFolderContext } from '@/contexts/FolderContext'
import { createTask, updateTask, getTask } from '@/lib/supabase/tasks'

interface TaskEditorProps {
  onSave?: () => void
}

export default function TaskEditor({ onSave }: TaskEditorProps) {
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { selectedFolderId, selectedTaskId, setSelectedTaskId } = useFolderContext()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: '내용을 입력하세요...',
      }),
    ],
    immediatelyRender: false,
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] px-4 py-8',
      },
    },
  })

  // 선택된 Task 로드
  useEffect(() => {
    const loadTask = async () => {
      if (!selectedTaskId || !editor) return

      setIsLoading(true)
      try {
        const task = await getTask(selectedTaskId)
        setTitle(task.title)
        if (task.content) {
          editor.commands.setContent(task.content)
        } else {
          editor.commands.clearContent()
        }
      } catch (error) {
        console.error('Error loading task:', error)
        alert('Task를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [selectedTaskId, editor])

  // Task 선택 해제 시 초기화
  useEffect(() => {
    if (!selectedTaskId && editor) {
      setTitle('')
      editor.commands.clearContent()
    }
  }, [selectedTaskId, editor])

  const handleSave = useCallback(async () => {
    if (!title.trim() && !editor?.getText().trim()) {
      alert('제목 또는 내용을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const content = editor?.getHTML() || null

      if (selectedTaskId) {
        // 수정 모드
        await updateTask(selectedTaskId, {
          title: title.trim() || '제목 없음',
          content,
          folder_id: selectedFolderId || null,
        })
      } else {
        // 새로 만들기 모드
        await createTask(title.trim() || '제목 없음', content, selectedFolderId || null)
      }

      // 성공 알림
      const toast = document.createElement('div')
      toast.className =
        'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in'
      toast.textContent = '저장되었습니다'
      document.body.appendChild(toast)

      setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transition = 'opacity 0.3s'
        setTimeout(() => {
          document.body.removeChild(toast)
        }, 300)
      }, 2000)

      // 새로 만든 경우가 아니면 초기화하지 않음
      if (!selectedTaskId) {
        setTitle('')
        editor?.commands.clearContent()
      }

      if (onSave) {
        onSave()
      }
    } catch (error: any) {
      console.error('Error saving task:', error)
      alert(error.message || '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }, [title, editor, selectedFolderId, selectedTaskId, onSave])

  return (
    <div className="h-full flex flex-col">
      {/* 저장 버튼 */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        {selectedTaskId && (
          <button
            onClick={() => {
              setSelectedTaskId(null)
              setTitle('')
              editor?.commands.clearContent()
            }}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← 새 글 작성
          </button>
        )}
        <div className="flex-1"></div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isSaving ? '저장 중...' : isLoading ? '로딩 중...' : '저장'}
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="flex-1 overflow-y-auto">
        {/* 제목 입력 */}
        <div className="px-8 pt-8 pb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 없음"
            className="w-full text-4xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 focus:outline-none"
            style={{ fontSize: '2.5rem', lineHeight: '1.2' }}
          />
        </div>

        {/* Tiptap 에디터 */}
        <div className="px-8 pb-8">
          <EditorContent editor={editor} />
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .ProseMirror pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }
        .dark .ProseMirror code {
          background-color: #374151;
        }
        .dark .ProseMirror blockquote {
          border-left-color: #4b5563;
        }
      `}</style>
    </div>
  )
}
