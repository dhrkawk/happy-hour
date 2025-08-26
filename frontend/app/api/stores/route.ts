import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store.repo.supabase';
import { StoreInsertSchema, type StoreInsertDTO } from '@/domain/schemas/schemas';

const parseBool = (v?: string | null) =>
  v === '1' || v === 'true' || v === 'on';

export async function GET(req: NextRequest) {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  const { searchParams } = new URL(req.url);
  const onlyActive = parseBool(searchParams.get('onlyActive'));

  try {
    const rows = await repo.getStoresWithEvents(onlyActive);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to get stores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    const body = (await req.json()) as unknown;
    const dto = StoreInsertSchema.parse(body) as StoreInsertDTO;

    const out = await repo.createStore(dto);
    return NextResponse.json(out, { status: 201 });
  } catch (e: any) {
    const status = e?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({ error: e?.message ?? 'Failed to create store' }, { status });
  }
}