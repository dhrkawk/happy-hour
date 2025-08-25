// hooks/profiles/use-get-user-profile.ts
'use client';

import { useQuery, type QueryKey } from '@tanstack/react-query';
import { jsonFetch } from './fetcher';
import type { UserProfile } from '@/domain/entities/entities';
import { buildUserProfileVM, type UserProfileVM } from '@/lib/vm/profile.vm';

export function useGetUserProfile() {
  const key: QueryKey = ['profiles', 'me'];

  return useQuery({
    queryKey: key,
    queryFn: () => jsonFetch<UserProfile>('/api/profiles'),
    select: buildUserProfileVM,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}