'use client'

import { useState } from 'react'
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
      total_bookings: 0,
      total_savings: 0,
      agreed_marketing: agreedMarketing,
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
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>

            <div className="space-y-2">
              {/* 서비스 이용약관 동의 */}
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={agreedTerms} onCheckedChange={() => setAgreedTerms(!agreedTerms)} />
                <Label htmlFor="terms" className="text-sm">서비스 이용약관 동의 (필수)</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 text-xs text-teal-500">보기</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogTitle className="font-bold">서비스 이용약관</DialogTitle>
                    <p className="text-sm text-gray-600 overflow-auto max-h-60">
                      여기에 서비스 이용약관 내용을 입력하세요...
                    </p>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 개인정보 수집 및 이용 동의 */}
              <div className="flex items-center space-x-2">
                <Checkbox id="privacy" checked={agreedPrivacy} onCheckedChange={() => setAgreedPrivacy(!agreedPrivacy)} />
                <Label htmlFor="privacy" className="text-sm">개인정보 수집 및 이용 동의 (필수)</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 text-xs text-teal-500">보기</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogTitle className="font-bold">개인정보 처리방침</DialogTitle>
                    <p className="text-sm text-gray-600 overflow-auto max-h-60">
                      여기에 개인정보 처리방침 내용을 입력하세요...
                    </p>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 위치정보 수집 및 이용 동의 */}
              <div className="flex items-center space-x-2">
                <Checkbox id="location" checked={agreedLocation} onCheckedChange={() => setAgreedLocation(!agreedLocation)} />
                <Label htmlFor="location" className="text-sm">위치 정보 수집 및 이용 동의 (선택)</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 text-xs text-teal-500">보기</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogTitle className="font-bold">위치정보 이용약관</DialogTitle>
                    <p className="text-sm text-gray-600 overflow-auto max-h-60">
                      여기에 위치정보 이용약관 내용을 입력하세요...
                    </p>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 마케팅 정보 수신 동의 (선택) */}
              <div className="flex items-center space-x-2">
                <Checkbox id="marketing" checked={agreedMarketing} onCheckedChange={() => setAgreedMarketing(!agreedMarketing)} />
                <Label htmlFor="marketing" className="text-sm">마케팅 정보 수신 동의 (선택)</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 text-xs text-teal-500">보기</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogTitle className="font-bold">마케팅 정보 수신 동의</DialogTitle>
                    <p className="text-sm text-gray-600 overflow-auto max-h-60">
                      여기에 마케팅 정보 수신 동의 내용을 입력하세요...
                    </p>
                  </DialogContent>
                </Dialog>
              </div>
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