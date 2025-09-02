// app/api/events/route.ts
import { NextResponse } from 'next/server';
import {
  CreateEventWithDiscountsAndGiftsSchema,
  UpdateEventWithDiscountsAndGiftsSchema,
  type CreateEventWithDiscountsAndGiftsDTO,
  type UpdateEventWithDiscountsAndGiftsDTO,
} from '@/domain/schemas/schemas';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseEventRepository } from '@/infra/supabase/repository/event.repo.supabase';

// GET /api/events?storeId=...
const QuerySchema = z.object({
  storeId: z.string().uuid(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      storeId: url.searchParams.get('storeId'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'STORE_ID_REQUIRED' }, { status: 400 });
    }

    const sb = await createClient();
    const repo = new SupabaseEventRepository(sb);
    const events = await repo.getEventsByStoreId(parsed.data.storeId);
    return NextResponse.json(events , { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'INTERNAL_ERROR' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  const sb = await createClient();
  const repo = new SupabaseEventRepository(sb);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateEventWithDiscountsAndGiftsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { eventId } = await repo.createEventWithDiscountsAndGifts(
      parsed.data as CreateEventWithDiscountsAndGiftsDTO
    );
    const res = NextResponse.json({ eventId }, { status: 201 });
    res.headers.set('Location', `/api/events/${eventId}`);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const sb = await createClient();
  const repo = new SupabaseEventRepository(sb);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = UpdateEventWithDiscountsAndGiftsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    console.log(parsed.data);
    const { eventId } = await repo.updateEventWithDiscountsAndGifts(
      parsed.data as UpdateEventWithDiscountsAndGiftsDTO
    );
    return NextResponse.json({ eventId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}