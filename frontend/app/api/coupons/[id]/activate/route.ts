import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseCouponRepository } from '@/infra/supabase/repository/coupon.repo.supabase';

// 이 라우트는 Node.js 런타임에서 실행되도록 강제합니다.
// await params 패턴이 Node.js 런타임에서만 동작할 수 있으므로 유지합니다.
export const runtime = 'nodejs';

const IdSchema = z.string().uuid();

function mapError(e: any) {
  const msg = String(e?.message ?? e);
  if (msg.includes('COUPON_NOT_FOUND'))      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (msg.includes('COUPON_EXPIRED'))        return NextResponse.json({ error: 'COUPON_EXPIRED' }, { status: 409 });
  if (msg.includes('COUPON_NOT_ACTIVATABLE')) return NextResponse.json({ error: 'COUPON_NOT_ACTIVATABLE' }, { status: 409 });
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 올바른 패턴: params를 await 하여 실제 id 값을 비동기적으로 가져옵니다.
    const { id } = await params;

    // 가져온 id 값의 유효성을 검사합니다.
    const parsedId = IdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: 'INVALID_ID', details: parsedId.error.flatten() }, { status: 400 });
    }

    const sb = await createClient();
    const repo = new SupabaseCouponRepository(sb);

    // 새로 만든 activate 메소드 호출
    await repo.activateCouponById(parsedId.data);

    return new NextResponse(null, { status: 204 }); // 성공 (내용 없음)
  } catch (e) {
    return mapError(e);
  }
}