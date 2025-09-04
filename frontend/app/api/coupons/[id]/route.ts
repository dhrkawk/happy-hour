// app/api/coupons/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server'
import { SupabaseCouponRepository } from '@/infra/supabase/repository/coupon.repo.supabase';

const ParamsSchema = z.object({ id: z.string().uuid() });

function mapError(e: any) {
  const msg = String(e?.message ?? e);
  if (msg.includes('COUPON_NOT_FOUND')) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}

/** GET /api/coupons/:id */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  try {
    const sb = await createClient();
    const repo = new SupabaseCouponRepository(sb);

    const detail = await repo.getCouponWithItemsById(id);
    return NextResponse.json(detail);
  } catch (e) {
    return mapError(e);
  }
}