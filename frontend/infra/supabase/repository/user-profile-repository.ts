// infra/supabase/user-profile-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/infra/supabase/shared/types';

import type { Id, Page } from '@/domain/shared/repository';
import type { UserProfileRepository, UserProfileFilter } from '@/domain/user/user-profile.repository';
import { UserProfile } from '@/domain/user/user-profile.entity';

// Supabase 타입 별칭
type Row    = Tables<'user_profiles'>;
type Insert = TablesInsert<'user_profiles'>;
type Update = TablesUpdate<'user_profiles'>;

export class SupabaseUserProfileRepository implements UserProfileRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  // ---------- helpers ----------
  private toEntity = (r: Row): UserProfile =>
    UserProfile.create({
      user_id: r.user_id,
      email: r.email,
      provider_id: r.provider_id,
      name: r.name,
      phone_number: r.phone_number,
      total_bookings: r.total_bookings,
      total_savings: r.total_savings,
      created_at: r.created_at,
      updated_at: r.updated_at,
      role: r.role,
      provider: r.provider,
      marketing_consent: r.marketing_consent,
    });

  private applyFilter(q: ReturnType<SupabaseClient['from']> & any, filter?: UserProfileFilter) {
    if (!filter) return q;
    if (filter.role) q = q.eq('role', filter.role);
    if (typeof filter.marketingConsent === 'boolean') q = q.eq('marketing_consent', filter.marketingConsent);
    if (filter.searchEmail?.trim()) q = q.ilike('email', `%${filter.searchEmail.trim()}%`);
    return q;
  }

  private applyPage(q: ReturnType<SupabaseClient['from']> & any, page?: Page) {
    if (!page) return q;
    const limit = page.limit ?? 20;
    const offset = page.offset ?? 0;
    return q.range(offset, offset + limit - 1);
  }

  // ---------- queries ----------
  async getById(userId: Id): Promise<UserProfile | null> {
    const { data, error } = await this.sb
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async getByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await this.sb
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async listByIds(userIds: Id[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await this.sb
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async list(filter?: UserProfileFilter, page?: Page): Promise<UserProfile[]> {
    let q = this.sb.from('user_profiles').select('*') as any;
    q = this.applyFilter(q, filter);
    // 기본 정렬: 최신 업데이트 순
    q = q.order('updated_at', { ascending: false });
    q = this.applyPage(q, page);

    const { data, error } = (await q) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async count(filter?: UserProfileFilter): Promise<number> {
    let q = this.sb.from('user_profiles').select('*', { count: 'exact', head: true }) as any;
    q = this.applyFilter(q, filter);
    const { count, error } = (await q) as { count: number | null; error: any };
    if (error) throw error;
    return count ?? 0;
  }

  async save(profile: UserProfile): Promise<void> {
    const row = profile.toRow() as Insert;
    const { error } = await this.sb.from('user_profiles').upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
  }

  async setMarketingConsent(userId: Id, consent: boolean): Promise<void> {
    const { error } = await this.sb
      .from('user_profiles')
      .update({ marketing_consent: consent, updated_at: new Date().toISOString() } satisfies Partial<Update>)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async incrementBookings(userId: Id, by: number = 1): Promise<void> {
    const current = await this.getById(userId);
    if (!current) throw new Error('UserProfile not found');

    const next = Math.max(0, (current.totalBookings ?? 0) + by);
    const { error } = await this.sb
      .from('user_profiles')
      .update({ total_bookings: next, updated_at: new Date().toISOString() } satisfies Partial<Update>)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async addSavings(userId: Id, amount: number): Promise<void> {
    if (amount <= 0) return; // 음수 방지
    const current = await this.getById(userId);
    if (!current) throw new Error('UserProfile not found');

    const next = Math.max(0, (current.totalSavings ?? 0) + amount);
    const { error } = await this.sb
      .from('user_profiles')
      .update({ total_savings: next, updated_at: new Date().toISOString() } satisfies Partial<Update>)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async delete(userId: Id): Promise<void> {
    const { error } = await this.sb.from('user_profiles').delete().eq('user_id', userId);
    if (error) throw error;
  }
}