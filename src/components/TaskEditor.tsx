'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useFolderContext, folderKey } from '@/contexts/FolderContext'
import { createTask, updateTask, getTask } from '@/lib/supabase/tasks'
import { Button } from '@/components/ui/button'

interface TaskEditorProps {
  onSave?: () => void
}

export default function TaskEditor({ onSave }: TaskEditorProps) {
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { selectedFolderId, selectedTaskId, setSelectedTaskId, addTaskToFolder } = useFolderContext()

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
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[420px] leading-relaxed',
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
        // 새로 만들기 모드: DB 저장 후 현재 폴더 목록에 즉시 반영 (낙관적 업데이트)
        const newTask = await createTask(
          title.trim() || '제목 없음',
          content,
          selectedFolderId || null
        )
        addTaskToFolder(folderKey(selectedFolderId), newTask)
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
  }, [title, editor, selectedFolderId, selectedTaskId, onSave, addTaskToFolder])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 툴바 */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-border/50 bg-muted/30">
        {selectedTaskId && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => {
              setSelectedTaskId(null)
              setTitle('')
              editor?.commands.clearContent()
            }}
          >
            ← 새 글 작성
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          size="sm"
          className="shrink-0"
        >
          {isSaving ? '저장 중...' : isLoading ? '로딩 중...' : '저장'}
        </Button>
      </div>

      {/* 에디터 영역 - 노션 스타일: 테두리 없음, 여백·폰트 조정 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
          {/* 제목: 테두리 없음, 큰 폰트, 여백만 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 없음"
            className="w-full bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none text-[2rem] sm:text-[2.25rem] font-bold leading-tight tracking-tight mb-2"
          />

          {/* 본문: Tiptap - 테두리 없음, 글쓰기 집중 */}
          <div className="mt-6 [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px] [&_.ProseMirror]:text-[1.0625rem] [&_.ProseMirror]:leading-[1.75] [&_.ProseMirror]:text-foreground">
            <EditorContent editor={editor} />
          </div>
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
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1 {
          font-size: 1.875em;
          font-weight: 700;
          margin: 1em 0 0.5em;
          line-height: 1.3;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.9em 0 0.4em;
          line-height: 1.35;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.8em 0 0.35em;
          line-height: 1.4;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.625em;
          margin: 0.6em 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1em;
          margin: 1em 0;
          color: hsl(var(--muted-foreground));
        }
        .ProseMirror code {
          background: hsl(var(--muted));
          padding: 0.2em 0.35em;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: ui-monospace, monospace;
        }
        .ProseMirror pre {
          background: hsl(var(--muted));
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
        }
        .ProseMirror pre code {
          background: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  )
}
