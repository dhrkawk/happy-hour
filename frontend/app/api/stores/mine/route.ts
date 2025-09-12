import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store.repo.supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const details = searchParams.get('details') === 'true';

  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    if (details) {
      const stores = await repo.getMyStores();
      return NextResponse.json(stores);
    } else {
      const ids = await repo.getMyStoreIds();
      return NextResponse.json(ids);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to get my stores data' }, { status: 500 });
  }
}