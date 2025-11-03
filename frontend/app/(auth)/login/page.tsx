"use client"

import { useState } from "react"
import Image from "next/image"
import { createClient } from "@/infra/supabase/shared/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import AlertDialogBasic from "@/components/alert-dialog-basic"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const showAlert = (msg: string) => {
    setAlertMessage(msg ?? "")
    setAlertOpen(true)
  }

  const handleSocialLogin = async (provider: "kakao" | "google") => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    })
    if (error) {
      showAlert("소셜 로그인 오류: " + error.message)
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
            <CardTitle className="text-2xl text-center text-gray-800">시작하기</CardTitle>
            <p className="text-sm text-gray-600 text-center">
              소셜 계정으로 간편하게 로그인하세요
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  카카오로 시작하기
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
                  구글로 시작하기
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 하단 정보 */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            로그인하시면 개인정보처리방침 및 서비스 이용약관에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
      <AlertDialogBasic
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title="알림"
        message={alertMessage}
        okText="확인"
        onOk={() => setAlertOpen(false)}
      />
    </div>
  )
}