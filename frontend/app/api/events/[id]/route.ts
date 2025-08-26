import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseEventRepository } from '@/infra/supabase/repository/event.repo.supabase';
import { Id } from '@/domain/shared/repository';

const Params = z.object({ id: z.string().uuid() });
const parseBool = (v?: string | null) => v === '1' || v === 'true' || v === 'on';

export async function GET(req: Request, { params }: { params: { id: Id } }) {
  const { id } = await params;
  const onlyActive = parseBool(new URL(req.url).searchParams.get('onlyActive'));

  const sb = await createClient();
  const repo = new SupabaseEventRepository(sb);

  try {
    const data = await repo.getEventWithDiscountsAndGiftsById(id, { onlyActive });
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    if (e?.message?.includes('not found') || e?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const { id } = Params.parse(ctx.params);

  const sb = await createClient();
  const repo = new SupabaseEventRepository(sb);

  try {
    await repo.softDeleteEvent(id);
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}