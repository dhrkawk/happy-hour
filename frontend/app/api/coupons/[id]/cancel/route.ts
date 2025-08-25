import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseCouponRepository } from '@/infra/supabase/repository/coupon.repo.supabase';

const ParamsSchema = z.object({ id: z.string().uuid() });

function mapError(e: any) {
  const msg = String(e?.message ?? e);
  if (msg.includes('COUPON_NOT_FOUND'))      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (msg.includes('COUPON_EXPIRED'))        return NextResponse.json({ error: 'COUPON_EXPIRED' }, { status: 409 });
  if (msg.includes('ALREADY_REDEEMED'))      return NextResponse.json({ error: 'ALREADY_REDEEMED' }, { status: 409 });
  if (msg.includes('ALREADY_CANCELLED'))     return NextResponse.json({ error: 'ALREADY_CANCELLED' }, { status: 409 });
  if (msg.includes('FORBIDDEN'))             return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
  }

  try {
    const sb = await createClient();
    const repo = new SupabaseCouponRepository(sb);

    await repo.cancelCouponById(parsed.data.id);

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return mapError(e);
  }
}