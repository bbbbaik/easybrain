'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Brain } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Supabase 클라이언트를 useRef로 한 번만 생성 (무한 루프 방지)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // 이미 로그인된 경우 메인으로 자동 이동 (한 번만 실행)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 배열로 한 번만 실행

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // 비밀번호 확인
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        alert(error.message)
        setIsLoading(false)
        return
      }

      // 회원가입 성공 시 하드 리프레시로 메인으로 이동 (보안: 캐시 초기화)
      if (data.session) {
        alert('가입을 환영합니다!')
        window.location.href = '/'
      } else {
        // 이메일 확인이 필요한 경우
        alert('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
        setIsLoading(false)
      }
    } catch (error: any) {
      alert(error.message || '회원가입에 실패했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-toss-base px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-sm p-8 sm:p-10">
          {/* Logo & App Name */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Brain size={32} className="text-toss-blue" />
              <h1 className="text-3xl font-extrabold text-toss-text tracking-tight">
                EasyBrain
              </h1>
            </div>
            <p className="text-sm text-toss-gray mt-2">새 계정을 만들어 시작하세요</p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSignup}>
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-toss-text">
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-toss-text">
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-toss-text">
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base font-medium"
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-toss-gray">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="font-medium text-toss-blue hover:text-toss-blue/80 transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-toss-gray hover:text-toss-text transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
