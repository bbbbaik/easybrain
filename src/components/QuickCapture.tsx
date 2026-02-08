'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPage } from '@/services/pageService'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PLACEHOLDERS = [
  '지금 무슨 생각을 하고 있나요?',
  '잊어버리기 전에 기록하세요.',
  '여기에 아이디어를 쏟아내세요.',
]

export function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isAnimatedOpen, setIsAnimatedOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bottomOffset, setBottomOffset] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const SAFETY_TIMEOUT_MS = 5000

  // 상태 초기화 (반복 사용 시 무한 로딩 방지)
  const resetState = useCallback(() => {
    setInputValue('')
    setIsSubmitting(false)
  }, [])

  // 닫기: 클로즈 애니메이션 후 상태 청소 (ESC·배경 클릭·저장 성공 시 공통)
  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
  }, [isClosing])

  // 랜덤 placeholder 선택
  useEffect(() => {
    const randomPlaceholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
    setPlaceholder(randomPlaceholder)
  }, [])

  // 모달 열릴 때 강제 초기화 + Elastic 오픈 애니메이션 트리거
  useEffect(() => {
    if (isOpen) {
      resetState()
      setIsAnimatedOpen(false)
      setBottomOffset(null)
      document.body.style.overflow = 'hidden'
      const openTimer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimatedOpen(true))
      })
      const focusTimer = setTimeout(() => inputRef.current?.focus(), 150)
      return () => {
        cancelAnimationFrame(openTimer)
        clearTimeout(focusTimer)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
      setBottomOffset(null)
    }
  }, [isOpen, resetState])

  // 클로즈 애니메이션 후 실제 언마운트
  useEffect(() => {
    if (!isClosing) return
    const id = setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      resetState()
    }, 200)
    return () => clearTimeout(id)
  }, [isClosing, resetState])

  // VisualViewport API로 모바일 키보드 대응
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) {
      return
    }

    const handleViewportChange = () => {
      const viewport = window.visualViewport
      if (!viewport) return

      // 키보드가 올라왔는지 확인 (viewport height가 window height보다 작으면)
      const keyboardHeight = window.innerHeight - viewport.height
      if (keyboardHeight > 150) {
        // 키보드가 올라왔을 때: 키보드 위 20px 위치
        // viewport.offsetTop을 고려하여 정확한 위치 계산
        const offset = keyboardHeight + 20 - (viewport.offsetTop || 0)
        setBottomOffset(Math.max(20, offset))
      } else {
        // 키보드가 내려갔을 때
        setBottomOffset(null)
      }
    }

    // 초기 계산
    handleViewportChange()

    const viewport = window.visualViewport
    viewport.addEventListener('resize', handleViewportChange)
    viewport.addEventListener('scroll', handleViewportChange)

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportChange)
        viewport.removeEventListener('scroll', handleViewportChange)
      }
    }
  }, [isOpen])

  // 전역 단축키 핸들러 (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) 또는 Ctrl+K (Windows/Linux)
      const isModifierKey = e.metaKey || e.ctrlKey
      if (isModifierKey && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      // Esc 키로 닫기 (상태 청소 후 닫기)
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose])

  // 페이지 생성 핸들러 (5초 안전 타임아웃 + handleClose로 청소)
  const handleSubmit = useCallback(
    async (e?: React.FormEvent | React.KeyboardEvent) => {
      e?.preventDefault?.()
      if (!inputValue.trim() || isSubmitting) return

      setIsSubmitting(true)

      // 안전 타이머: 5초 내 완료되지 않으면 강제 해제 (무한 로딩 원천 차단)
      let timeoutFired = false
      const timeoutId = window.setTimeout(() => {
        timeoutFired = true
        setIsSubmitting(false)
        alert('저장 시간이 초과되었습니다. 다시 시도해주세요.')
      }, SAFETY_TIMEOUT_MS)

      try {
        await createPage({
          title: inputValue.trim(),
          is_inbox: true,
        })

        window.clearTimeout(timeoutId)
        if (timeoutFired) return

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refresh-pages'))
        }
        handleClose()
        router.refresh()
      } catch (error: any) {
        window.clearTimeout(timeoutId)
        console.error('Error creating page:', error)
        const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.'
        alert(`저장 실패: ${errorMessage}`)
      } finally {
        // 타임아웃이 이미 로딩 해제한 경우 제외
        if (!timeoutFired) {
          setIsSubmitting(false)
        }
      }
    },
    [inputValue, isSubmitting, router, handleClose]
  )

  // Enter 키 처리 (키보드 포커스 누수 방지)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 저장 중이면 키보드 이벤트 무시
    if (isSubmitting) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSubmit(e)
    }
  }

  // 모달 컨테이너의 키보드 이벤트 차단 (포커스 누수 방지)
  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  const visible = isOpen || isClosing

  if (!visible) return null

  return (
    <>
      {/* Overlay: 뒤쪽 콘텐츠 흐리게 */}
      <div
        className={cn(
          'fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm transition-opacity duration-200',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog: Glassmorphism + Elastic open / quick close */}
      <div
        className={cn(
          'fixed left-1/2 z-[9999] w-full max-w-2xl -translate-x-1/2',
          bottomOffset !== null ? 'bottom-auto' : 'top-1/2 -translate-y-1/2',
          'transition-all',
          isClosing ? 'duration-200 ease-out scale-95 opacity-0' : 'duration-350 ease-elastic',
          isAnimatedOpen && !isClosing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        style={
          bottomOffset !== null
            ? { bottom: `${bottomOffset}px` }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleContainerKeyDown}
      >
        <div className="mx-4 rounded-2xl bg-white/60 backdrop-blur-xl shadow-elevation-floating p-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-xl border-0 bg-transparent px-5 py-4 text-xl shadow-none outline-none',
              'placeholder:text-slate-400 text-slate-900 font-medium',
              'focus:ring-0 focus:outline-none focus-visible:ring-0',
              'transition-colors duration-200'
            )}
          />
          {isSubmitting && (
            <div className="px-5 pb-2 text-center text-sm text-slate-500 leading-relaxed">
              저장 중...
            </div>
          )}
        </div>
      </div>
    </>
  )
}
