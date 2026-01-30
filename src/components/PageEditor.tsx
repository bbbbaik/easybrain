'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { usePageContext } from '@/contexts/PageContext'
import { getPage, updatePage } from '@/lib/supabase/pages'

const DEBOUNCE_MS = 1000

export default function PageEditor() {
  const { selectedPageId } = usePageContext()
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    immediatelyRender: false,
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[420px] leading-relaxed px-0',
      },
    },
  })

  const persist = useCallback(async () => {
    if (!selectedPageId) return
    setSaveStatus('saving')
    try {
      const html = editor?.getHTML() ?? null
      await updatePage(selectedPageId, {
        title: title.trim() || '제목 없음',
        content: html ? { content: html } : null,
      })
      setSaveStatus('saved')
      if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
        saveStatusTimeoutRef.current = null
      }, 2000)
    } catch (error) {
      console.error('Error saving page:', error)
      setSaveStatus('idle')
    }
  }, [selectedPageId, title, editor])

  useEffect(() => {
    const load = async () => {
      if (!selectedPageId || !editor) return
      setIsLoading(true)
      try {
        const page = await getPage(selectedPageId)
        if (page) {
          setTitle(page.title ?? '')
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
            editor.commands.setContent('')
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

  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!selectedPageId) return
    const t = setTimeout(() => persist(), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [selectedPageId, title, persist])

  useEffect(() => {
    if (!editor || !selectedPageId) return
    const handler = () => {
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current)
      contentDebounceRef.current = setTimeout(() => {
        contentDebounceRef.current = null
        persist()
      }, DEBOUNCE_MS)
    }
    editor.on('update', handler)
    return () => {
      editor.off('update', handler)
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current)
    }
  }, [editor, selectedPageId, persist])

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  if (selectedPageId == null) {
    return (
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <p className="text-base">페이지를 선택하거나 새로 만드세요</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="relative flex-1 flex flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-start justify-end px-6 py-2 bg-background/95 backdrop-blur border-b border-border/50">
          <span className="text-xs text-slate-500">
            {saveStatus === 'saving' && '저장 중...'}
            {saveStatus === 'saved' && '저장됨'}
          </span>
        </div>

        <div className="max-w-3xl mx-auto w-full px-6 py-8">
          <input
            type="text"
            value={title}
            onChange={onTitleChange}
            placeholder="제목 없음"
            className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100 py-2 mb-4"
          />
          {isLoading ? (
            <div className="text-slate-500 text-sm">불러오는 중...</div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      </div>
    </main>
  )
}
