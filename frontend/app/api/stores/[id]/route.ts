import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store.repo.supabase';
import { StoreUpdateSchema, type StoreUpdateDTO } from '@/domain/schemas/schemas';
import type { Id } from '@/domain/shared/repository';

const parseBool = (v?: string | null) =>
  v === '1' || v === 'true' || v === 'on';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: Id } }
) {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  const { searchParams } = new URL(req.url);
  const onlyActiveEvents = parseBool(searchParams.get('onlyActiveEvents'));

  try {
    const { id } = await params;
    const data = await repo.getStoreWithEventsAndMenusByStoreId(id, {
      onlyActiveEvents,
    });
    return NextResponse.json(data);
  } catch (e: any) {
    const msg = e?.message ?? 'Failed to get store';
    const status = /not found/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: Id } }
) {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    const body = (await req.json()) as unknown;
    const dto = StoreUpdateSchema.parse(body) as StoreUpdateDTO;

    await repo.updateStore(params.id, dto);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({ error: e?.message ?? 'Failed to update store' }, { status });
  }
}