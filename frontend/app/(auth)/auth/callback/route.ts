import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infra/supabase/shared/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?message=Missing code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/login?message=Auth Failed`)
  }

  return NextResponse.redirect(`${requestUrl.origin}/home`)
}