// app/api/menus/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreMenuRepository } from '@/infra/supabase/repository/menu.repos.supabase';
import { StoreMenuUpdateSchema } from '@/domain/schemas/schemas';

const ParamsSchema = z.object({ id: z.string().uuid() });

// PATCH /api/menus/:id
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(ctx.params);
    const dto = StoreMenuUpdateSchema.parse(await req.json());

    const sb = await createClient();
    const repo = new SupabaseStoreMenuRepository(sb);
    await repo.updateMenu(id, dto);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    if (e?.issues) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', issues: e.issues }, { status: 400 });
    }
    // Supabase not-found는 보통 204/0rows로 오니, 구현체에서 throw 한 경우만 404로 매핑하고 싶다면 아래 조건 추가 가능
    // if (e?.code === 'PGRST116') return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
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