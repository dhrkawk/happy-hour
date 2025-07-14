"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    setIsLoading(true)

    // 회원가입 시뮬레이션
    setTimeout(() => {
      setIsLoading(false)
      localStorage.setItem("isLoggedIn", "true")
      alert("회원가입이 완료되었습니다!")
      window.location.href = "/home"
    }, 1500)
  }

  const handleSocialSignup = (provider: "kakao" | "google") => {
    setIsLoading(true)

    // 소셜 회원가입 시뮬레이션
    setTimeout(() => {
      setIsLoading(false)
      localStorage.setItem("isLoggedIn", "true")
      window.location.href = "/home"
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">회원가입</h1>
        </div>

        <Card className="border-teal-100 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-800">계정 만들기</CardTitle>
            <p className="text-sm text-gray-600 text-center">해피아워에 가입하여 특별한 할인 혜택을 받아보세요</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 이메일/비밀번호 회원가입 */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  <Link href="/terms" className="text-teal-600 hover:text-teal-700">
                    서비스 이용약관
                  </Link>{" "}
                  및{" "}
                  <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
                    개인정보처리방침
                  </Link>
                  에 동의합니다.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    가입 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    회원가입
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

            {/* 소셜 회원가입 */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full py-3 border-yellow-300 hover:bg-yellow-50 text-gray-700 bg-transparent"
                onClick={() => handleSocialSignup("kakao")}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-400 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-black">K</span>
                  </div>
                  카카오로 가입하기
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full py-3 border-gray-300 hover:bg-gray-50 text-gray-700 bg-transparent"
                onClick={() => handleSocialSignup("google")}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-white rounded border flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-500">G</span>
                  </div>
                  구글로 가입하기
                </div>
              </Button>
            </div>

            {/* 로그인 링크 */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
