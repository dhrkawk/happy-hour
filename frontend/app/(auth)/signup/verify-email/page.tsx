import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MailCheck className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
          <CardDescription>
            회원가입을 완료하려면 이메일 인증이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            가입하신 이메일 주소의 받은 편지함(또는 스팸 편지함)을 확인하여 인증 링크를 클릭해주세요.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">로그인 페이지로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}