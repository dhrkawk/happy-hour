// infra/supabase/user-profile-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/infra/supabase/shared/types';

import type { Id } from '@/domain/shared/repository';
import type { UserProfileRepository } from '@/domain/repositories/user.repo';
import { UserProfile } from '@/domain/entities/entities';

// Row 타입 별칭
type UserProfileRow = Tables<'user_profiles'>;

export class SupabaseUserProfileRepository implements UserProfileRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  async getUserProfile(): Promise<UserProfile | null> {
    const { data: { user }, error: userErr } = await this.sb.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return null;

    const { data, error } = await this.sb
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<UserProfileRow>();

    if (error) throw error;
    if (!data) return null;

    return UserProfile.fromRow(data);
  }
}