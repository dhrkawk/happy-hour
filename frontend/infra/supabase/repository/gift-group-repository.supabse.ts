// infra/supabase/gift-group-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/infra/supabase/shared/types';
import type { Id, Page } from '@/domain/shared/repository';
import type { GiftGroupRepository } from '@/domain/gift/gift-group-repository';
import { GiftGroup } from '@/domain/gift/gift-group.entity';

type Row    = Tables<'gift_groups'>;
type Insert = TablesInsert<'gift_groups'>;
type Update = TablesUpdate<'gift_groups'>;

export class SupabaseGiftGroupRepository implements GiftGroupRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  private toEntity = (r: Row): GiftGroup =>
    GiftGroup.create({
      id: r.id,
      event_id: r.event_id,
      created_at: r.created_at,
    });

  private applyPage(q: ReturnType<SupabaseClient['from']> & any, page?: Page) {
    if (!page) return q;
    const limit = page.limit ?? 20;
    const offset = page.offset ?? 0;
    return q.range(offset, offset + limit - 1);
  }

  async getById(id: Id): Promise<GiftGroup | null> {
    const { data, error } = await this.sb
      .from('gift_groups')
      .select('*')
      .eq('id', id)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async listByEvent(eventId: Id, page?: Page): Promise<GiftGroup[]> {
    let q = this.sb.from('gift_groups').select('*').eq('event_id', eventId).order('created_at', { ascending: false }) as any;
    q = this.applyPage(q, page);
    const { data, error } = (await q) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async listByEventIds(eventIds: Id[]): Promise<GiftGroup[]> {
    if (!eventIds.length) return [];
    const { data, error } = await this.sb
      .from('gift_groups')
      .select('*')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false }) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async countByEvent(eventId: Id): Promise<number> {
    const { count, error } = await this.sb
      .from('gift_groups')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    if (error) throw error;
    return count ?? 0;
  }

  async save(group: GiftGroup): Promise<void> {
    const row = group.toRow() as Insert;
    const { error } = await this.sb.from('gift_groups').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async delete(id: Id): Promise<void> {
    const { error } = await this.sb.from('gift_groups').delete().eq('id', id);
    if (error) throw error;
  }
}