// app/api/menus/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreMenuRepository } from '@/infra/supabase/repository/menu.repos.supabase';
import { StoreMenuInsertSchema } from '@/domain/schemas/schemas';

const QuerySchema = z.object({
  storeId: z.string().uuid(),
});

// GET /api/menus?storeId=...
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store.repo.supabase';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      storeId: url.searchParams.get('storeId'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'STORE_ID_REQUIRED' }, { status: 400 });
    }
    const { storeId } = parsed.data;

    const sb = await createClient();
    const menuRepo = new SupabaseStoreMenuRepository(sb);
    const storeRepo = new SupabaseStoreRepository(sb);

    // Fetch both menus and store data (for categories) in parallel
    const [menus, storeData] = await Promise.all([
      menuRepo.getMenusByStoreId(storeId),
      storeRepo.getStoreWithEventsAndMenusByStoreId(storeId),
    ]);

    const categories = storeData.store.menuCategory ?? [];

    return NextResponse.json({ menus, categories }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// POST /api/menus  (bulk insert)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = z.array(StoreMenuInsertSchema).min(1).parse(body);

    const sb = await createClient();
    const repo = new SupabaseStoreMenuRepository(sb);
    await repo.createMenus(rows);

    return NextResponse.json({ created: rows.length }, { status: 201 });
  } catch (e: any) {
    // Zod 검증 실패 시
    if (e?.issues) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', issues: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? 'INTERNAL_ERROR' }, { status: 500 });
  }
}