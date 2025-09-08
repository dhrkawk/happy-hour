"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/infra/supabase/shared/client"
import Image from "next/image"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('이메일 또는 비밀번호가 잘못되었습니다.')
      setIsLoading(false)
      return
    }

    window.location.href = '/home'
  }

  const handleSocialLogin = async (provider: "kakao" | "google") => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      alert('소셜 로그인 오류: ' + error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 환영 메시지 */}
        <div className="text-center mb-8">

          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Image src="/logo.svg" alt="🍽️" width={200} height={200} />
          </div>
          
          <h1 className="text-3xl font-bold text-blue-600 mb-2">OURCAMPUS</h1>
          <p className="text-gray-600">할인 가게를 찾아 특별한 혜택을 받아보세요</p>
        </div>

        <Card className="border-blue-100 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-800">로그인</CardTitle>
            <p className="text-sm text-gray-600 text-center">계정에 로그인하여 할인 혜택을 받아보세요</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 이메일/비밀번호 로그인 */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-gray-600">로그인 상태 유지</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  비밀번호 찾기
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    로그인 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    로그인
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* 구분선 */}
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">또는</span>
              </div>
            </div>

            {/* 소셜 로그인 */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full py-3 border-yellow-300 hover:bg-yellow-50 text-gray-700 bg-transparent"
                onClick={() => handleSocialLogin("kakao")}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-400 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-black">K</span>
                  </div>
                  카카오로 로그인
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full py-3 border-gray-300 hover:bg-gray-50 text-gray-700 bg-transparent"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-white rounded border flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-500">G</span>
                  </div>
                  구글로 로그인
                </div>
              </Button>
            </div>

            {/* 회원가입 링크 */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                아직 계정이 없으신가요?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 하단 정보 */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>로그인하시면 개인정보처리방침 및 서비스 이용약관에 동의하는 것으로 간주됩니다.</p>
        </div>
      </div>
    </div>
  )
}
