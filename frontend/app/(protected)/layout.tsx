// app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/infra/supabase/shared/server'
import { AppProvider } from '@/contexts/app-context'
import { UserProfile } from '@/domain/entities/entities'
import { UserProfileVM, buildUserProfileVM } from '@/lib/vm/profile.vm'

export const dynamic = 'force-dynamic' // 또는 export const revalidate = 0

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // 1) 인증
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2) 프로필(온보딩 완료 여부) — 필요한 컬럼만!
  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`*`)
    .eq('user_id', user.id)
    .maybeSingle<UserProfile>()

  if (!profile) redirect('/onboarding')

  
  return (
    <AppProvider initialUser={buildUserProfileVM(profile)}>
      {children}
    </AppProvider>
  )
}