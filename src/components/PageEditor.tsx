'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { usePageContext } from '@/contexts/PageContext'
import { getPage, updatePage, createPage } from '@/lib/supabase/pages'
import { Button } from '@/components/ui/button'

interface PageEditorProps {
  onSave?: () => void
}

export default function PageEditor({ onSave }: PageEditorProps) {
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { selectedPageId, setSelectedPageId, refreshPages } = usePageContext()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    immediatelyRender: false,
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[420px] leading-relaxed',
      },
    },
  })

  useEffect(() => {
    const load = async () => {
      if (!selectedPageId || !editor) return
      setIsLoading(true)
      try {
        const page = await getPage(selectedPageId)
        if (page) {
          setTitle(page.title)
          if (page.content != null) {
            try {
              const c = page.content
              const html =
                typeof c === 'string' ? c : (c as Record<string, unknown>)?.content
              editor.commands.setContent(typeof html === 'string' ? html : '')
            } catch {
              editor.commands.setContent('')
            }
          } else {
            editor.commands.clearContent()
          }
        }
      } catch (error) {
        console.error('Error loading page:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [selectedPageId, editor])

  useEffect(() => {
    if (!selectedPageId && editor) {
      setTitle('')
      editor.commands.clearContent()
    }
  }, [selectedPageId, editor])

  const handleSave = useCallback(async () => {
    if (!title.trim() && !editor?.getText().trim()) {
      alert('제목 또는 내용을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const content = editor?.getHTML() ?? null

      if (selectedPageId) {
        await updatePage(selectedPageId, {
          title: title.trim() || '제목 없음',
          content: content ? { content } : null,
        })
      } else {
        const newPage = await createPage(title.trim() || '제목 없음', null, content ? { content } : null)
        setSelectedPageId(newPage.id)
        refreshPages()
      }

      const toast = document.createElement('div')
      toast.className =
        'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      toast.textContent = '저장되었습니다'
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transition = 'opacity 0.3s'
        setTimeout(() => document.body.removeChild(toast), 300)
      }, 2000)

      if (!selectedPageId) {
        setTitle('')
        editor?.commands.clearContent()
      }
      onSave?.()
    } catch (error: unknown) {
      console.error('Error saving page:', error)
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }, [title, editor, selectedPageId, setSelectedPageId, refreshPages, onSave])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 없음"
          className="flex-1 text-2xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground"
        />
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="text-muted-foreground">불러오는 중...</div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  )
}
