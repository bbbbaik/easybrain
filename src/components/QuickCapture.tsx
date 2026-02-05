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
  const [inputValue, setInputValue] = useState('')
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bottomOffset, setBottomOffset] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 랜덤 placeholder 선택
  useEffect(() => {
    const randomPlaceholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
    setPlaceholder(randomPlaceholder)
  }, [])

  // 모달 열릴 때 상태 초기화 및 body overflow 처리
  useEffect(() => {
    if (isOpen) {
      // 상태 초기화: 입력창 텍스트와 로딩 상태를 초기화
      setInputValue('')
      setIsSubmitting(false)
      setBottomOffset(null)
      
      document.body.style.overflow = 'hidden'
      // 포커스 설정
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      document.body.style.overflow = ''
      setBottomOffset(null)
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

      // Esc 키로 닫기
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // 페이지 생성 핸들러
  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // 페이지 생성 요청
      await createPage({
        title: inputValue.trim(),
        is_inbox: true,
      })
      
      // 성공 시: 모달 닫기 및 화면 갱신
      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      // 에러 처리: 상세 로그 및 사용자 알림
      console.error('Error creating page:', error)
      const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.'
      alert(`저장 실패: ${errorMessage}`)
      // 에러 발생 시에도 모달은 열어두고, 로딩 상태만 해제
    } finally {
      // 성공하든 실패하든 무조건 로딩 상태 해제 (무한 로딩 방지)
      setIsSubmitting(false)
    }
  }, [inputValue, isSubmitting, router])

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
      handleSubmit()
    }
  }

  // 모달 컨테이너의 키보드 이벤트 차단 (포커스 누수 방지)
  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Input Container */}
      <div
        className={cn(
          'fixed left-1/2 z-[9999] w-full max-w-2xl -translate-x-1/2 transition-all duration-200',
          bottomOffset !== null
            ? 'bottom-auto'
            : 'top-1/2 -translate-y-1/2'
        )}
        style={
          bottomOffset !== null
            ? {
                bottom: `${bottomOffset}px`,
              }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleContainerKeyDown}
      >
        <div className="mx-4">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-xl border-2 border-gray-200 bg-white px-6 py-4 text-lg shadow-lg',
              'focus:border-toss-blue focus:outline-none focus:ring-2 focus:ring-toss-blue/20',
              'placeholder:text-toss-gray',
              'transition-all duration-200'
            )}
          />
          {isSubmitting && (
            <div className="mt-2 text-center text-sm text-toss-gray">
              저장 중...
            </div>
          )}
        </div>
      </div>
    </>
  )
}
