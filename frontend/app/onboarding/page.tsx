'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeVerified, setIsCodeVerified] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [agreedLocation, setAgreedLocation] = useState(false)
  const [agreedMarketing, setAgreedMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [timer, setTimer] = useState(0)

  const isFormValid = name && phone && agreedTerms && agreedPrivacy && agreedLocation && isCodeVerified

  const handleSendCode = () => {
    if (!phone) {
      alert('전화번호를 입력해주세요.')
      return
    }
    setIsCodeSent(true)
    setIsCodeVerified(false)
    setTimer(60) // 60초 카운트다운 시작
    // 실제 API 호출은 추후 구현 예정
  }

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('user_profiles').insert({
      user_id: user.id,
      email: user.email,
      provider: user.app_metadata?.provider ?? null,
      provider_id: user.app_metadata?.provider_id ?? null,
      name,
      phone_number: phone,
      total_bookings: 0,
      total_savings: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    setIsLoading(false)
    if (error) {
      alert('정보 저장에 실패했습니다. 다시 시도해주세요.')
      console.error(error)
    } else {
      localStorage.setItem('onboardingChecked', 'true')
      router.push('/home')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-teal-50 to-white">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl text-teal-600">환영합니다!</CardTitle>
          <CardDescription className="text-gray-500">서비스 이용을 위해 정보를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <div className="flex flex-col gap-1">
                {isCodeSent && timer > 0 && (
                  <div className="text-xs text-gray-500 text-right">{timer}초 후 재발송 가능  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="01012345678"
                    required
                  />
                  <Button type="button" onClick={handleSendCode} variant="outline" disabled={timer > 0}>
                    인증번호 발송
                  </Button>
                </div>
              </div>
            </div>

            {isCodeSent && (
              <div className="space-y-2">
                <Label htmlFor="code">인증번호</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="인증번호 입력"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!verificationCode) {
                        alert('인증번호를 입력해주세요.')
                      } else {
                        // 실제 인증번호 확인 로직은 추후 구현 예정
                        alert('인증번호 확인 완료!')
                        setIsCodeVerified(true)
                      }
                    }}
                  >
                    인증번호 확인
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <AgreementCheckbox id="terms" checked={agreedTerms} setChecked={setAgreedTerms} title="서비스 이용약관 동의 (필수)" dialogTitle="서비스 이용약관" />
              <AgreementCheckbox id="privacy" checked={agreedPrivacy} setChecked={setAgreedPrivacy} title="개인정보 수집 및 이용 동의 (필수)" dialogTitle="개인정보 처리방침" />
              <AgreementCheckbox id="location" checked={agreedLocation} setChecked={setAgreedLocation} title="위치 정보 수집 및 이용 동의 (필수)" dialogTitle="위치정보 이용약관" />
              <AgreementCheckbox id="marketing" checked={agreedMarketing} setChecked={setAgreedMarketing} title="마케팅 정보 수신 동의 (선택)" dialogTitle="마케팅 정보 수신 동의" />
            </div>

            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={!isFormValid || isLoading}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 저장 중...</>) : '저장하고 시작하기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AgreementCheckbox({ id, checked, setChecked, title, dialogTitle }: { id: string, checked: boolean, setChecked: (v: boolean) => void, title: string, dialogTitle: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} checked={checked} onCheckedChange={() => setChecked(!checked)} />
      <Label htmlFor={id} className="text-sm">{title}</Label>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" className="p-0 text-xs text-teal-500">보기</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogTitle className="font-bold">{dialogTitle}</DialogTitle>
          <p className="text-sm text-gray-600 overflow-auto max-h-60">
            여기에 내용을 입력하세요...
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}