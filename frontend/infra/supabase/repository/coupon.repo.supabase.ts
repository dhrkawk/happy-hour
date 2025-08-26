// infra/supabase/coupon-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/infra/supabase/shared/types';

import type { Id } from '@/domain/shared/repository';
import type { CouponRepository } from '@/domain/repositories/coupon.repo';
import type { CreateCouponTxDTO } from '@/domain/schemas/schemas';
import { Coupon, CouponItem, CouponWithItems, buildCouponWithItems } from '@/domain/entities/entities';
import { mapCreateCouponDtoToPayload } from '../shared/utils';

// Row 타입 별칭
type CouponRow     = Tables<'coupons'>;
type CouponItemRow = Tables<'coupon_items'>;

export class SupabaseCouponRepository implements CouponRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  /**
   * 쿠폰 생성 + 아이템 처리 (재고 차감/비활성/이벤트 요약 재계산까지 RPC 내부에서 원자적으로 수행)
   * RPC: public.create_coupon_with_items(payload jsonb) → uuid (coupon_id)
   *
   * CreateCouponTxDTO는 (user_id, event_id, items[]) 를 포함합니다.
   * 서버는 payload에서 필요한 필드만 사용하므로, 여기선 안전한 JSON payload로 매핑해 보냅니다.
   */
  async createCouponWithItemsByUserId(dto: CreateCouponTxDTO): Promise<{ couponId: Id }> {
    // RPC가 요구하는 최소 payload로 매핑 (JSON-safe)
    const payload = mapCreateCouponDtoToPayload(dto);

    const { data, error } = await this.sb.rpc('create_coupon_with_items', { payload });
    if (error) throw error;

    const couponId = data as string | null;
    if (!couponId) throw new Error('RPC did not return coupon_id');
    return { couponId: couponId as Id };
  }

  /**
   * 쿠폰 사용(소진) 처리
   * - 만료되었거나(현재 시각 > expired_time) 취소/소진 상태면 실패 (RPC에서 검증)
   * RPC: public.redeem_coupon(p_coupon_id uuid) → void
   */
  async redeemCouponById(couponId: Id): Promise<void> {
    const { error } = await this.sb.rpc('redeem_coupon', { p_coupon_id: couponId });
    if (error) throw error;
  }

  /**
   * 쿠폰 취소
   * - 이미 만료/소진 상태면 실패 (RPC에서 검증)
   * RPC: public.cancel_coupon(p_coupon_id uuid) → void
   */
  async cancelCouponById(couponId: Id): Promise<void> {
    const { error } = await this.sb.rpc('cancel_coupon', { p_coupon_id: couponId });
    if (error) throw error;
  }

  /**
   * 특정 사용자의 쿠폰 목록
   */
  async getCouponsByUserId(userId: Id): Promise<Coupon[]> {
    const { data, error } = await this.sb
      .from('coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = (data ?? []) as CouponRow[];
    return rows.map(Coupon.fromRow);
  }


    /**
     * 단일 쿠폰 + 아이템들
     */
    async getCouponWithItemsById(couponId: Id): Promise<CouponWithItems> {
        // 1) 쿠폰 헤더
        const { data: cRow, error: cErr } = await this.sb
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .maybeSingle<CouponRow>();
        if (cErr) throw cErr;
        if (!cRow) throw new Error('Coupon not found');
    
        // 2) 쿠폰 아이템
        const { data: iRows, error: iErr } = await this.sb
        .from('coupon_items')
        .select('*')
        .eq('coupon_id', couponId);
        if (iErr) throw iErr;
    
        // 빌더에 raw row들을 전달
        return buildCouponWithItems({
        couponRow: cRow,
        itemRows: (iRows ?? []) as CouponItemRow[],
        });
    }
}