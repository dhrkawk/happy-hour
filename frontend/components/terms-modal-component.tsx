import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function TermsModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          서비스 이용약관 및 개인정보 처리방침 보기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>서비스 이용약관</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-64 border rounded p-2">
          <p className="text-sm text-gray-700">
            제1조 (목적) ...
            <br /><br />
            제2조 (회원가입) ...
            <br /><br />
            제3조 (서비스의 제공 및 변경) ...
            <br /><br />
            제4조 (회원의 의무) ...
            <br /><br />
            제5조 (개인정보 보호) ...
            <br /><br />
            제6조 (책임의 한계) ...
            <br /><br />
            제7조 (약관의 개정) ...
            <br /><br />
            [부칙] 본 약관은 2025년 7월 19일부터 시행합니다.
          </p>
        </ScrollArea>

        <DialogHeader>
          <DialogTitle className="mt-4">개인정보 처리방침</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-64 border rounded p-2">
          <p className="text-sm text-gray-700">
            1. 수집하는 개인정보 항목 ...
            <br /><br />
            2. 개인정보의 수집 및 이용목적 ...
            <br /><br />
            3. 개인정보의 보유 및 이용기간 ...
            <br /><br />
            4. 개인정보 제공 및 공유 ...
            <br /><br />
            5. 개인정보의 파기절차 및 방법 ...
            <br /><br />
            6. 이용자의 권리와 행사방법 ...
            <br /><br />
            7. 개인정보 보호책임자 ...
          </p>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
