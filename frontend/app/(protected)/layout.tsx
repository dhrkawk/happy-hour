// app/(protected)/layout.tsx
import { createClient } from '@/infra/supabase/shared/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
  .from('user_profiles')
  .select('user_id')
  .eq('user_id', user.id)
  .maybeSingle()

  if (!profile) {
    redirect('/onboarding')
  }

  return (
    <>
      {children}
    </>
  )
}