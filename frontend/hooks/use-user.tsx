'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/infra/supabase/shared/client'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getSessionAndProfile = async () => {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        let storeData = null;
        if (profile && (profile.role === 'store_owner' || profile.role === 'admin')) {  //admin 은 임시
          const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', session.user.id)
            .single();

          if (storeError) {
            console.error("Error fetching store data for owner:", storeError);
          } else if (store) {
            storeData = store;
          }
        }

        if (profileError) {
          console.error("Error fetching user profile:", profileError)
          setUser(session.user) // Still set auth user even if profile fetch fails
        } else {
          setUser({ ...session.user, profile, storeData }) // Combine auth user with profile and store data
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    getSessionAndProfile()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // When auth state changes, re-fetch profile to ensure data is fresh
      getSessionAndProfile()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  return { user, isLoading }
}