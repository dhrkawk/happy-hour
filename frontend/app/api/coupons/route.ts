// app/api/coupons/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseCouponRepository } from '@/infra/supabase/repository/coupon.repo.supabase';
import { CreateCouponTxSchema, type CreateCouponTxDTO } from '@/domain/schemas/schemas';

const GetQuerySchema = z.object({
  userId: z.string().uuid(), // 쿼리 파라미터
});

function mapError(e: any) {
  const msg = String(e?.message ?? e);

  // create 관련 (RPC에서 raise한 코드들)
  if (msg.includes('EVENT_NOT_FOUND_OR_INACTIVE')) return NextResponse.json({ error: 'EVENT_NOT_FOUND_OR_INACTIVE' }, { status: 404 });
  if (msg.includes('DISCOUNT_STOCK_SHORTAGE'))     return NextResponse.json({ error: 'DISCOUNT_STOCK_SHORTAGE' }, { status: 409 });
  if (msg.includes('GIFT_STOCK_SHORTAGE'))         return NextResponse.json({ error: 'GIFT_STOCK_SHORTAGE' }, { status: 409 });
  if (msg.includes('INVALID_ITEM_TYPE'))           return NextResponse.json({ error: 'INVALID_ITEM_TYPE' }, { status: 400 });
  if (msg.includes('ITEMS_ARRAY_REQUIRED'))        return NextResponse.json({ error: 'ITEMS_ARRAY_REQUIRED' }, { status: 400 });

  // 공통
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}

/** GET /api/coupons?userId=... */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = GetQuerySchema.safeParse({ userId: url.searchParams.get('userId') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_USER_ID' }, { status: 400 });
  }

  try {
    const sb = await createClient();
    const repo = new SupabaseCouponRepository(sb);
    const rows = await repo.getCouponsByUserId(parsed.data.userId);
    return NextResponse.json({ coupons: rows });
  } catch (e) {
    return mapError(e);
  }
}

/** POST /api/coupons */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dto = CreateCouponTxSchema.parse(body) as CreateCouponTxDTO;
    const sb = await createClient();
    const repo = new SupabaseCouponRepository(sb);

    const { couponId } = await repo.createCouponWithItemsByUserId(dto);
    return NextResponse.json({ couponId }, { status: 201 });
  } catch (e: any) {
    if (e?.issues) {
      // zod validation error
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: e.issues }, { status: 400 });
    }
    return mapError(e);
  }
}