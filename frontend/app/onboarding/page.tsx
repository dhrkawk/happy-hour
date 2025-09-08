'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/infra/supabase/shared/client'
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
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [agreedLocation, setAgreedLocation] = useState(false)
  const [agreedMarketing, setAgreedMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isFormValid = name && phone && agreedTerms && agreedPrivacy && agreedLocation

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
      role: 'customer',
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
    <div className="min-h-screen bg-gray-50 max-w-xl mx-auto flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl text-blue-600">환영합니다!</CardTitle>
          <CardDescription className="text-gray-500">
            서비스 이용을 위해 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="01012345678"
                required
              />
            </div>

            <div className="space-y-2">
              <AgreementCheckbox
                id="terms"
                checked={agreedTerms}
                setChecked={setAgreedTerms}
                title="서비스 이용약관 동의 (필수)"
                dialogTitle="서비스 이용약관"
              />
              <AgreementCheckbox
                id="privacy"
                checked={agreedPrivacy}
                setChecked={setAgreedPrivacy}
                title="개인정보 수집 및 이용 동의 (필수)"
                dialogTitle="개인정보 처리방침"
              />
              <AgreementCheckbox
                id="location"
                checked={agreedLocation}
                setChecked={setAgreedLocation}
                title="위치 정보 수집 및 이용 동의 (필수)"
                dialogTitle="위치정보 이용약관"
              />
              <AgreementCheckbox
                id="marketing"
                checked={agreedMarketing}
                setChecked={setAgreedMarketing}
                title="마케팅 정보 수신 동의 (선택)"
                dialogTitle="마케팅 정보 수신 동의"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 저장 중...
                </>
              ) : (
                '저장하고 시작하기'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AgreementCheckbox({
  id,
  checked,
  setChecked,
  title,
  dialogTitle,
}: {
  id: string
  checked: boolean
  setChecked: (v: boolean) => void
  title: string
  dialogTitle: string
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={() => setChecked(!checked)}
      />
      <Label htmlFor={id} className="text-sm">
        {title}
      </Label>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" className="p-0 text-xs text-blue-500">
            보기
          </Button>
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