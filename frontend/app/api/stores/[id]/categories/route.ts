
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store.repo.supabase';
import type { Id } from '@/domain/shared/repository';
import { z } from 'zod';

// PATCH request body validation schema
const CategoriesUpdateSchema = z.object({
  categories: z.array(z.string()),
});

/**
 * GET handler to fetch menu categories for a specific store.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: Id } }
) {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    const { id } = await params;
    const { store } = await repo.getStoreWithEventsAndMenusByStoreId(id);
    const categories = store.menuCategory ?? [];
    return NextResponse.json(categories);
  } catch (e: any) {
    const msg = e?.message ?? 'Failed to get store categories';
    const status = /not found/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/**
 * PATCH handler to update menu categories for a specific store.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: Id } }
) {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    const { id } = await params;
    const body = await req.json();
    const validation = CategoriesUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { categories } = validation.data;

    await repo.partialUpdateStore(id, { menu_category: categories });
    
    return NextResponse.json({ ok: true, message: 'Categories updated successfully' });
  } catch (e: any) {
    const status = e?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({ error: e?.message ?? 'Failed to update categories' }, { status });
  }
}
