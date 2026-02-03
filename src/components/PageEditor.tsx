'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { FileText, ChevronRight, Home } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import { getPage, updatePage } from '@/lib/supabase/pages'
import { IconPicker } from '@/components/IconPicker'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 1000

// 예쁜 파스텔톤 그라데이션 목록
const GRADIENT_PRESETS = [
  'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(to right, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(to right, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(to right, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(to right, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(to right, #fad0c4 0%, #ffd1ff 100%)',
  'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(to right, #a8edea 0%, #fed6e3 100%)',
]

// 랜덤 그라데이션 선택
const getRandomGradient = (): string => {
  return GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)]
}

export default function PageEditor() {
  const { selectedPageId, pages, selectPage, refreshPages } = usePageContext()
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [isHoveringTitle, setIsHoveringTitle] = useState(false)
  const [isHoveringCover, setIsHoveringCover] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Breadcrumbs: 현재 페이지부터 parent_id를 타고 올라가 [최상위, ..., 직전 부모, 현재] 순서의 배열
  const breadcrumbPath = useMemo(() => {
    if (!selectedPageId) return []
    const path: typeof pages = []
    let id: string | null = selectedPageId
    while (id) {
      const page = pages.find((p) => p.id === id)
      if (!page) break
      path.push(page)
      id = page.parent_id
    }
    return path.reverse() // [root, ..., parent, current]
  }, [pages, selectedPageId])

  // 하위 페이지 찾기: 현재 페이지를 parent_id로 가지고 있는 페이지들
  const childPages = useMemo(() => {
    if (!selectedPageId) return []
    return pages
      .filter((page) => page.parent_id === selectedPageId)
      .sort((a, b) => a.position - b.position)
  }, [pages, selectedPageId])

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
          setIcon(page.icon ?? null)
          setCoverImage(page.cover_image ?? null)
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
      setIcon(null)
      setCoverImage(null)
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

  const onIconChange = useCallback(
    async (newIcon: string | null) => {
      if (!selectedPageId) return
      setIcon(newIcon)
      try {
        await updatePage(selectedPageId, { icon: newIcon })
        await refreshPages() // 페이지 목록 갱신
      } catch (error) {
        console.error('Error updating icon:', error)
      }
    },
    [selectedPageId, refreshPages]
  )

  // 현재 페이지 정보 가져오기
  const currentPage = useMemo(() => {
    if (!selectedPageId) return null
    return pages.find((p) => p.id === selectedPageId)
  }, [pages, selectedPageId])

  // 커버 추가/변경
  const handleAddCover = useCallback(async () => {
    if (!selectedPageId) return
    const gradient = getRandomGradient()
    setCoverImage(gradient)
    try {
      await updatePage(selectedPageId, { cover_image: gradient })
      await refreshPages()
    } catch (error) {
      console.error('Error updating cover:', error)
    }
  }, [selectedPageId, refreshPages])

  // 커버 삭제
  const handleRemoveCover = useCallback(async () => {
    if (!selectedPageId) return
    setCoverImage(null)
    try {
      await updatePage(selectedPageId, { cover_image: null })
      await refreshPages()
    } catch (error) {
      console.error('Error removing cover:', error)
    }
  }, [selectedPageId, refreshPages])

  if (selectedPageId == null) {
    return (
      <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
        <div className="flex-1 flex items-center justify-center text-toss-gray">
          <p className="text-base leading-relaxed">페이지를 선택하거나 새로 만드세요</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
      <div className="relative flex-1 flex flex-col overflow-y-auto">
        <div className="relative w-full max-w-4xl mx-auto">
          {/* 1. 상단 네비게이션 (Breadcrumbs + 저장 상태) */}
          <div className="sticky top-0 z-50 h-10 flex items-center justify-between px-6 py-2 bg-white/80 backdrop-blur border-b border-black/5">
            <nav className="flex items-center gap-1 text-sm text-toss-gray flex-wrap min-w-0 flex-1 leading-relaxed">
              {breadcrumbPath.length > 0 ? (
                breadcrumbPath.length === 1 ? (
                  <span className="flex items-center gap-1 text-toss-text">
                    {breadcrumbPath[0].icon ? (
                      <span className="text-base">{breadcrumbPath[0].icon}</span>
                    ) : (
                      <Home size={14} className="shrink-0" />
                    )}
                    <span className="truncate">{breadcrumbPath[0].title || '제목 없음'}</span>
                  </span>
                ) : (
                  breadcrumbPath.map((page, index) => {
                    const isLast = index === breadcrumbPath.length - 1
                    return (
                      <span key={page.id} className="flex items-center gap-1 shrink-0">
                        {index > 0 && <ChevronRight size={14} className="shrink-0 text-toss-gray" />}
                        {isLast ? (
                          <span className="flex items-center gap-1 text-toss-text font-semibold">
                            {page.icon ? (
                              <span className="text-base">{page.icon}</span>
                            ) : (
                              <FileText size={14} className="shrink-0" />
                            )}
                            <span className="truncate">{page.title || '제목 없음'}</span>
                          </span>
                        ) : index === 0 ? (
                          <button
                            type="button"
                            onClick={() => selectPage(page.id)}
                            className="flex items-center gap-1 hover:text-toss-blue transition-colors"
                          >
                            {page.icon ? (
                              <span className="text-base">{page.icon}</span>
                            ) : (
                              <Home size={14} className="shrink-0" />
                            )}
                            <span className="truncate">{page.title || '제목 없음'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => selectPage(page.id)}
                            className="flex items-center gap-1 hover:text-toss-blue transition-colors truncate"
                          >
                            {page.icon ? (
                              <span className="text-base shrink-0">{page.icon}</span>
                            ) : (
                              <FileText size={14} className="shrink-0" />
                            )}
                            <span className="truncate">{page.title || '제목 없음'}</span>
                          </button>
                        )}
                      </span>
                    )
                  })
                )
              ) : null}
            </nav>
            <span className="text-xs text-toss-gray shrink-0 ml-2">
              {saveStatus === 'saving' && '저장 중...'}
              {saveStatus === 'saved' && '저장됨'}
            </span>
          </div>

          {/* 2. 커버 이미지 (Optional) */}
          {coverImage && (
            <div
              className="relative w-full h-48 rounded-t-3xl"
              style={{ background: coverImage }}
              onMouseEnter={() => setIsHoveringCover(true)}
              onMouseLeave={() => setIsHoveringCover(false)}
            >
              {isHoveringCover && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCover}
                    className="rounded-full border-0 bg-gray-100 hover:bg-gray-200 text-toss-text text-xs px-3 py-1.5 transition-colors"
                  >
                    커버 변경
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="rounded-full border-0 bg-gray-100 hover:bg-gray-200 text-toss-text text-xs px-3 py-1.5 transition-colors"
                  >
                    커버 삭제
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. 메인 컨텐츠 영역 */}
          <div
            className={cn('px-6 sm:px-10 pb-20', !coverImage && 'mt-8')}
            onMouseEnter={() => setIsHoveringTitle(true)}
            onMouseLeave={() => setIsHoveringTitle(false)}
          >
            {/* 커버 추가 버튼 (커버 없을 때만, group-hover로 제목 위에 표시, 브레드크럼과 겹치지 않음) */}
            {!coverImage && isHoveringTitle && (
              <button
                type="button"
                onClick={handleAddCover}
                className="mb-2 text-xs text-toss-gray hover:text-toss-blue rounded-full border-0 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 transition-colors"
              >
                🎨 커버 추가
              </button>
            )}

            {/* 아이콘 (커버 유무에 따라 마진 동적 변경) */}
            <div
              className={cn(
                'flex items-start gap-3',
                coverImage ? '-mt-10 relative z-10' : 'mt-0'
              )}
            >
              <div className="shrink-0">
                <IconPicker value={icon} onChange={onIconChange} defaultIcon="📄" />
              </div>
              <input
                type="text"
                value={title}
                onChange={onTitleChange}
                placeholder="제목 없음"
                className="flex-1 min-w-0 text-4xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-toss-gray text-toss-text py-2 leading-relaxed"
              />
            </div>

            {/* 제목 아래 여백 */}
            <div className="mb-4" />

            {/* 하위 페이지 링크 목록 */}
            {childPages.length > 0 && (
              <div className="mb-6 pb-4 border-b border-black/5">
                <div className="flex flex-wrap gap-2">
                  {childPages.map((childPage) => (
                    <button
                      key={childPage.id}
                      onClick={() => selectPage(childPage.id)}
                      className="flex items-center gap-1.5 text-toss-gray hover:bg-black/5 hover:text-toss-blue rounded-full border-0 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 cursor-pointer transition-colors text-sm leading-relaxed"
                    >
                      {childPage.icon ? (
                        <span className="text-base shrink-0">{childPage.icon}</span>
                      ) : (
                        <FileText size={14} className="shrink-0" />
                      )}
                      <span className="truncate">{childPage.title || '제목 없음'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="text-toss-gray text-sm leading-relaxed">불러오는 중...</div>
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
