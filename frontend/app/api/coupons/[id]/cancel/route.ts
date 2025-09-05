import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseCouponRepository } from '@/infra/supabase/repository/coupon.repo.supabase';

// Force this route to run on the Node.js runtime instead of the Edge.
export const runtime = 'nodejs';

// ID 유효성 검사 스키마
const IdSchema = z.string().uuid();

function mapError(e: any) {
  const msg = String(e?.message ?? e);
  if (msg.includes('COUPON_NOT_FOUND'))      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (msg.includes('COUPON_EXPIRED'))        return NextResponse.json({ error: 'COUPON_EXPIRED' }, { status: 409 });
  if (msg.includes('ALREADY_REDEEMED'))      return NextResponse.json({ error: 'ALREADY_REDEEMED' }, { status: 409 });
  if (msg.includes('ALREADY_CANCELLED'))     return NextResponse.json({ error: 'ALREADY_CANCELLED' }, { status: 409 });
  if (msg.includes('FORBIDDEN'))             return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Next.js Route Handler params는 동기 객체입니다.
    const { id } = params;

    // 가져온 id 값의 유효성을 검사합니다.
    const parsedId = IdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: 'INVALID_ID', details: parsedId.error.flatten() }, { status: 400 });
    }

    const sb = await createClient();
    const repo = new SupabaseCouponRepository(sb);

    await repo.cancelCouponById(parsedId.data);

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    // TEMPORARY DEBUGGING: Return the raw database error to the client
    console.error('[DEBUG] Raw error in cancel route:', e);
    return NextResponse.json(
      {
        error: 'RAW_DATABASE_ERROR',
        message: e.message,
        details: e.details,
        stack: e.stack,
      },
      { status: 500 }
    );
  }
}
