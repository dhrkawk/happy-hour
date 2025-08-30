import { NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store.repo.supabase';

export async function GET() {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    const id = await repo.getMyStoreId();
    return NextResponse.json( id );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to get my store id' }, { status: 500 });
  }
}