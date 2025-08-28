// app/api/menus/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreMenuRepository } from '@/infra/supabase/repository/menu.repos.supabase';
import { StoreMenuUpdateSchema } from '@/domain/schemas/schemas';
import { UUID } from 'crypto';

const ParamsSchema = z.object({ id: z.string() });

// PATCH /api/menus/:id
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(ctx.params);

    const json = await req.json();
    const dto = StoreMenuUpdateSchema.parse(json);

    const sb = await createClient();
    const repo = new SupabaseStoreMenuRepository(sb);
    await repo.updateMenu(id, dto);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    // Zod 검증 실패(id or body)
    if (e?.issues) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', issues: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// DELETE /api/menus/:id
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(ctx.params);

    const sb = await createClient();
    const repo = new SupabaseStoreMenuRepository(sb);
    await repo.deleteMenu(id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'INTERNAL_ERROR' }, { status: 500 });
  }
}