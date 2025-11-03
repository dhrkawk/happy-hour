import { type NextRequest } from 'next/server'
import { updateSession } from '@/infra/supabase/shared/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/protected/:path*',
    '/api/protected/:path*',
  ],
}