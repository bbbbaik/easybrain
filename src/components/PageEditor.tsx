'use client'

import { SlashCommand, getSuggestionItems, renderItems } from '@/extensions/slashCommand'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { usePageContext } from '@/contexts/PageContext'
import { createPage, updatePage, getPage } from '@/lib/supabase/pages'
import { uploadImage } from '@/lib/imageUpload'
import { Button } from '@/components/ui/button'
import type { Page } from '@/types/page.types'

// Image extension import (패키지가 없을 경우 대비)
// @ts-ignore - 패키지가 설치되지 않았을 수 있음
let TiptapImage: any = null
try {
  // @ts-ignore
  const imageModule = require('@tiptap/extension-image')
  TiptapImage = imageModule.default || imageModule
} catch (error) {
  // 패키지가 없으면 무시 (이미지 업로드 기능은 동작하지 않음)
}

interface PageEditorProps {
  onSave?: () => void
}

export default function PageEditor({ onSave }: PageEditorProps) {
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { selectedPageId, selectPage, refreshPages, pages } = usePageContext()
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 브레드크럼 경로 계산: 현재 페이지부터 parent_id를 따라 올라가면서 경로 구성
  const breadcrumbPath = useMemo(() => {
    if (!selectedPageId || pages.length === 0) return []
    
    const path: Page[] = []
    let currentPageId: string | null = selectedPageId
    
    // parent_id를 따라 올라가면서 경로 구성
    while (currentPageId) {
      const page = pages.find((p) => p.id === currentPageId)
      if (!page) break
      path.push(page)
      currentPageId = page.parent_id
    }
    
    // 루트부터 현재까지 순서로 정렬 (역순)
    return path.reverse()
  }, [selectedPageId, pages])

  // Toast 표시 함수
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // 기존 toast 제거
    const existingToast = document.querySelector('.image-upload-toast')
    if (existingToast) {
      existingToast.remove()
    }

    const toast = document.createElement('div')
    toast.className = `image-upload-toast fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
      type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
    }`
    toast.textContent = message
    document.body.appendChild(toast)

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }

    toastTimeoutRef.current = setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.3s'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
        toastTimeoutRef.current = null
      }, 300)
    }, type === 'error' ? 4000 : 2000)
  }, [])

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
      ...(TiptapImage
        ? [
            TiptapImage.configure({
              inline: false,
              allowBase64: false,
            }),
          ]
        : []),
      Markdown.configure({
        html: true,
        transformPastedText: true,
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
        },
      }),
    ],
    immediatelyRender: false,
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[420px] leading-relaxed',
      },
      handleDrop: (view, event, slice, moved) => {
        // 이미 이미 이동된 경우 기본 동작 허용
        if (moved) return false

        // 파일이 있는지 확인
        const dragEvent = event as DragEvent
        const files = dragEvent.dataTransfer?.files
        if (!files || files.length === 0) return false

        // 이미지 파일만 처리
        const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        // 가장 먼저 브라우저 기본 동작 방지 (새 탭 열기 등)
        dragEvent.preventDefault()
        dragEvent.stopPropagation()

        // 여러 이미지 처리 (순차적으로)
        const processImages = async () => {
          for (const file of imageFiles) {
            setIsUploadingImage(true)
            showToast('이미지 업로드 중...', 'info')

            try {
              const imageUrl = await uploadImage(file)
              
              // 드래그된 위치에 이미지 삽입
              const coordinates = view.posAtCoords({ 
                left: dragEvent.clientX, 
                top: dragEvent.clientY 
              })
              
              if (coordinates) {
                const { schema } = view.state
                const node = schema.nodes.image?.create({ src: imageUrl })
                if (node) {
                  const transaction = view.state.tr.insert(coordinates.pos, node)
                  view.dispatch(transaction)
                } else {
                  // Image node가 없으면 HTML로 삽입
                  editor?.chain().focus().insertContent(`<img src="${imageUrl}" alt="" />`).run()
                }
              } else {
                // 좌표를 가져올 수 없으면 현재 커서 위치에 삽입
                editor?.chain().focus().insertContent(`<img src="${imageUrl}" alt="" />`).run()
              }

              showToast('이미지 업로드 완료!', 'success')
            } catch (error: any) {
              console.error('Error uploading image:', error)
              showToast(error.message || '이미지 업로드 실패', 'error')
            } finally {
              setIsUploadingImage(false)
            }
          }
        }

        // 비동기 처리 시작 (await 없이 호출)
        processImages()

        // 이벤트가 처리되었음을 Tiptap에 알림
        return true
      },
      handlePaste: (view, event) => {
        const items = (event as ClipboardEvent).clipboardData?.items
        if (!items) return false

        const imageItems = Array.from(items).filter((item) => item.type.startsWith('image/'))
        if (imageItems.length === 0) return false

        imageItems.forEach(async (item) => {
          const file = item.getAsFile()
          if (!file) return

          setIsUploadingImage(true)
          showToast('이미지 업로드 중...', 'info')

          try {
            const imageUrl = await uploadImage(file)
            editor?.chain().focus().insertContent(`<img src="${imageUrl}" alt="" />`).run()
            showToast('이미지 업로드 완료!', 'success')
          } catch (error: any) {
            console.error('Error uploading image:', error)
            showToast(error.message || '이미지 업로드 실패', 'error')
          } finally {
            setIsUploadingImage(false)
          }
        })

        return true
      },
    },
  })

  useEffect(() => {
    const loadPage = async () => {
      if (!selectedPageId || !editor) return

      setIsLoading(true)
      try {
        const page = await getPage(selectedPageId)
        if (page) {
          setTitle(page.title || '')
          if (page.content != null) {
            try {
              // content는 JSON 형태일 수 있음 ({ content: html } 또는 직접 HTML string)
              const c = page.content
              const html = typeof c === 'string' ? c : (c as Record<string, unknown>)?.content
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
        alert('페이지를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPage()
  }, [selectedPageId, editor])

  useEffect(() => {
    if (!selectedPageId && editor) {
      setTitle('')
      editor.commands.clearContent()
    }
  }, [selectedPageId, editor])

  // 마크다운 복사 기능
  const copyAsMarkdown = useCallback(() => {
    if (!editor) return

    // tiptap-markdown의 storage 타입 확장
    interface MarkdownStorage {
      markdown?: {
        getMarkdown: () => string
      }
    }
    
    const storage = editor.storage as MarkdownStorage
    if (!storage.markdown?.getMarkdown) {
      alert('마크다운 기능을 사용할 수 없습니다.')
      return
    }
    
    const markdown = storage.markdown.getMarkdown()
    
    navigator.clipboard.writeText(markdown)
    
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in'
    toast.textContent = '마크다운으로 복사되었어요! 📝'
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.3s'
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 2000)
  }, [editor])

  const handleSave = useCallback(async () => {
    if (!title.trim() && !editor?.getText().trim()) {
      alert('제목 또는 내용을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const html = editor?.getHTML() || null
      const content = html ? { content: html } : null

      if (selectedPageId) {
        // 기존 페이지 업데이트
        await updatePage(selectedPageId, {
          title: title.trim() || '제목 없음',
          content,
        })
        await refreshPages() // 페이지 목록 갱신
      } else {
        // 새 페이지 생성 (parentId는 null, 나중에 필요시 변경 가능)
        await createPage(
          title.trim() || '제목 없음',
          null, // parentId
          content
        )
        await refreshPages() // 페이지 목록 갱신
        // 새 페이지 생성 후 선택 해제
        setTitle('')
        editor?.commands.clearContent()
      }

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

      if (onSave) {
        onSave()
      }
    } catch (error: any) {
      console.error('Error saving page:', error)
      alert(error.message || '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }, [title, editor, selectedPageId, onSave, refreshPages])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex justify-between items-center px-6 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          {selectedPageId && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground -ml-2"
                onClick={() => {
                  selectPage(null)
                  setTitle('')
                  editor?.commands.clearContent()
                }}
              >
                ← 새 글 작성
              </Button>
              {breadcrumbPath.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                  {breadcrumbPath.map((page, index) => {
                    const isLast = index === breadcrumbPath.length - 1
                    return (
                      <span key={page.id} className="flex items-center gap-1">
                        {index > 0 && <span className="mx-1 select-none">›</span>}
                        {isLast ? (
                          <span className="text-foreground font-medium">
                            {page.title || '제목 없음'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => selectPage(page.id)}
                            className="hover:text-foreground transition-colors cursor-pointer"
                          >
                            {page.title || '제목 없음'}
                          </button>
                        )}
                      </span>
                    )
                  })}
                </nav>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAsMarkdown}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            MD 복사
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            size="sm"
            className="shrink-0"
          >
            {isSaving ? '저장 중...' : isLoading ? '로딩 중...' : '저장'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 없음"
            className="w-full bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none text-[2rem] sm:text-[2.25rem] font-bold leading-tight tracking-tight mb-2"
          />

          <div className="mt-6 [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px] [&_.ProseMirror]:text-[1.0625rem] [&_.ProseMirror]:leading-[1.75] [&_.ProseMirror]:text-foreground">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror { outline: none; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p { margin: 0.5em 0; }
        .ProseMirror h1 { font-size: 1.875em; font-weight: 700; margin: 1em 0 0.5em; line-height: 1.3; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: 600; margin: 0.9em 0 0.4em; line-height: 1.35; }
        .ProseMirror h3 { font-size: 1.25em; font-weight: 600; margin: 0.8em 0 0.35em; line-height: 1.4; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.625em; margin: 0.6em 0; }
        .ProseMirror ul { list-style-type: disc; }
        .ProseMirror ol { list-style-type: decimal; }
        .ProseMirror blockquote { border-left: 4px solid hsl(var(--border)); padding-left: 1em; margin: 1em 0; color: hsl(var(--muted-foreground)); }
        .ProseMirror code { background: hsl(var(--muted)); padding: 0.2em 0.35em; border-radius: 0.25rem; font-size: 0.9em; font-family: ui-monospace, monospace; }
        .ProseMirror pre { background: hsl(var(--muted)); padding: 1em; border-radius: 0.5rem; overflow-x: auto; margin: 1em 0; }
        .ProseMirror pre code { background: transparent; padding: 0; }
      `}</style>
    </div>
  )
}