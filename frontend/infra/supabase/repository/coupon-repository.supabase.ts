// infra/supabase/coupon-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/infra/supabase/shared/types';

import type { Id, Page } from '@/domain/shared/repository';
import type { CouponRepository, CouponWithItems } from '@/domain/coupon/coupon-repository';
import { Coupon, CouponItem, CouponStatus } from '@/domain/coupon/coupon.entity';

type CouponRow      = Tables<'coupons'>;
type CouponInsert   = TablesInsert<'coupons'>;
type CouponUpdate   = TablesUpdate<'coupons'>;
type ItemRow        = Tables<'coupon_items'>;
type ItemInsert     = TablesInsert<'coupon_items'>;

export class SupabaseCouponRepository implements CouponRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  // ---------- helpers ----------
  private toCoupon = (r: CouponRow): Coupon =>
    Coupon.create({
      id: r.id,
      user_id: r.user_id,
      store_id: r.store_id,
      expected_visit_time: r.expected_visit_time,
      status: r.status as CouponStatus,
      created_at: r.created_at ?? new Date().toISOString(),
      updated_at: r.updated_at ?? new Date().toISOString(),
      expired_time: r.expired_time,
    });

  private toItem = (r: ItemRow): CouponItem =>
    CouponItem.create({
      id: r.id,
      coupon_id: r.coupon_id,
      quantity: r.quantity,
      original_price: r.original_price,
      discount_rate: r.discount_rate,
      menu_name: r.menu_name,
      is_gift: r.is_gift,
      final_price: r.final_price,
    });

  private applyPage(q: ReturnType<SupabaseClient['from']> & any, page?: Page) {
    if (!page) return q;
    const limit = page.limit ?? 20;
    const offset = page.offset ?? 0;
    return q.range(offset, offset + limit - 1);
  }

  // ---------- create(트랜잭션) ----------
  /**
   * 권장: Postgres RPC `create_coupon_with_items` 사용 (아래 SQL 참고)
   */
  async create(coupon: Coupon, items: CouponItem[]): Promise<void> {
    // 1) 엔티티 → Row
    const cRow: CouponInsert = coupon.toRow() as CouponInsert;
    // RPC에선 coupon.id가 없으면 서버에서 생성해도 되고, 이미 생성된 id를 사용해도 됩니다.
    const iRows: ItemInsert[] = items.map(i => {
      const row = i.toRow() as ItemInsert;
      // 안전: coupon_id는 반드시 동일해야 함
      row.coupon_id = cRow.id ?? row.coupon_id;
      return row;
    });

    // 2) RPC 호출 (원자성 보장)
    const { error } = await this.sb.rpc('create_coupon_with_items', {
      p_coupon: cRow,
      p_items: iRows,
    });
    if (error) throw error;
  }

  // ---------- read ----------
  async getWithItems(id: Id): Promise<CouponWithItems | null> {
    const { data: c, error: e1 } = await this.sb
      .from('coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle<CouponRow>();
    if (e1) throw e1;
    if (!c) return null;

    const { data: items, error: e2 } = await this.sb
      .from('coupon_items')
      .select('*')
      .eq('coupon_id', id) as { data: ItemRow[] | null; error: any };
    if (e2) throw e2;

    return { coupon: this.toCoupon(c), items: (items ?? []).map(this.toItem) };
  }

  async listByUser(userId: Id, page?: Page, opt?: { status?: CouponStatus }): Promise<Coupon[]> {
    let q = this.sb.from('coupons').select('*').eq('user_id', userId).order('created_at', { ascending: false }) as any;
    if (opt?.status) q = q.eq('status', opt.status);
    q = this.applyPage(q, page);

    const { data, error } = (await q) as { data: CouponRow[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toCoupon);
  }

  // ---------- write ----------
  async updateStatus(id: Id, status: CouponStatus): Promise<void> {
    const { error } = await this.sb
      .from('coupons')
      .update({ status, updated_at: new Date().toISOString() } satisfies Partial<CouponUpdate>)
      .eq('id', id);
    if (error) throw error;
  }

  async addItems(couponId: Id, items: CouponItem[]): Promise<void> {
    if (items.length === 0) return;
    const rows: ItemInsert[] = items.map(i => {
      const row = i.toRow() as ItemInsert;
      row.coupon_id = couponId; // 강제 매핑
      return row;
    });
    const { error } = await this.sb.from('coupon_items').insert(rows);
    if (error) throw error;
  }

  async removeItem(itemId: Id): Promise<void> {
    const { error } = await this.sb.from('coupon_items').delete().eq('id', itemId);
    if (error) throw error;
  }

  /**
   * 전체 삭제(아이템 포함). 권장: RPC `delete_coupon_cascade` 사용
   * (외래키 ON DELETE CASCADE가 없으므로)
   */
  async delete(id: Id): Promise<void> {
    // const { error } = await this.sb.rpc('delete_coupon_cascade', { p_coupon_id: id });
    // if (error) throw error;

    // // 대안(비-RPC): 두 쿼리 순차 실행 (동시성/실패 롤백 취약)
    const { error: e1 } = await this.sb.from('coupon_items').delete().eq('coupon_id', id);
    if (e1) throw e1;
    const { error: e2 } = await this.sb.from('coupons').delete().eq('id', id);
    if (e2) throw e2;
  }
}