// app/api/stores/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';

import { SupabaseStoreRepository } from '@/infra/supabase/repository/store-repository.supabase';
import { SupabaseStoreMenuRepository } from '@/infra/supabase/repository/store-menu-repository.supabase';
import { SupabaseEventAggregateRepository } from '@/infra/supabase/repository/event-repository.supabase';

// 간단 파서
const parseBool = (v?: string | null) => v === '1' || v === 'true' || v === 'on';
const parseCSV  = (v?: string | null) =>
  (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

// ---------- GET (그대로) ----------
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const include = new Set(parseCSV(url.searchParams.get('include'))); // menus,events,discounts,gifts

  const eventIsActive = url.searchParams.get('eventIsActive');
  const fromDate = url.searchParams.get('fromDate') ?? undefined; // YYYY-MM-DD
  const toDate   = url.searchParams.get('toDate') ?? undefined;
  const weekdays = parseCSV(url.searchParams.get('weekdays'));
  const childActive = parseBool(url.searchParams.get('childActive')); // aggregate일 때만 적용

  const needMenus    = include.has('menus');
  const needEvents   = include.has('events');
  const needDiscount = include.has('discounts');
  const needGifts    = include.has('gifts');

  // discounts 또는 gifts를 요구하면 aggregate 모드로 이벤트를 조립
  const aggregate = needDiscount || needGifts;

  const sb = await createClient();
  const storeRepo = new SupabaseStoreRepository(sb);
  const menuRepo  = new SupabaseStoreMenuRepository(sb);
  const eventAggRepo = new SupabaseEventAggregateRepository(sb);

  try {
    // 1) 스토어 단건
    const store = await storeRepo.getById(params.id);
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 2) 선택 포함
    const tasks: Promise<any>[] = [];
    if (needMenus) tasks.push(menuRepo.listByStore(params.id));
    else tasks.push(Promise.resolve(null));

    if (needEvents) {
      if (aggregate) {
        tasks.push(
          eventAggRepo.listAggregatesByStore(
            params.id,
            undefined,
            { field: 'created_at', order: 'desc' },
            {
              isActive: eventIsActive == null ? undefined : parseBool(eventIsActive),
              fromDate,
              toDate,
              weekdays: weekdays.length ? weekdays : undefined,
            }
          )
        );
      } else {
        tasks.push(
          eventAggRepo.listEventsByStore(
            params.id,
            undefined,
            { field: 'created_at', order: 'desc' },
            {
              isActive: eventIsActive == null ? undefined : parseBool(eventIsActive),
              fromDate,
              toDate,
              weekdays: weekdays.length ? weekdays : undefined,
            }
          )
        );
      }
    } else {
      tasks.push(Promise.resolve(null));
    }

    const [menus, eventsOrAggs] = await Promise.all(tasks);

    // 3) childActive 필터(aggregate일 때만)
    let eventAggregates = null as any;
    let events = null as any;

    if (needEvents) {
      if (aggregate) {
        const aggs = (eventsOrAggs ?? []) as Awaited<
          ReturnType<typeof eventAggRepo.listAggregatesByStore>
        >;
        eventAggregates = childActive
          ? aggs.map(a => ({
              event: a.event,
              discounts: a.discounts.filter(d => d.isActive === true),
              giftGroups: a.giftGroups.map(g => ({
                group: g.group,
                options: g.options.filter(o => o.isActive === true),
              })),
            }))
          : aggs;
      } else {
        events = eventsOrAggs;
      }
    }

    // 4) 응답(필요한 필드만 포함)
    const res: any = { store };
    if (needMenus) res.menus = menus;
    if (aggregate) res.eventAggregates = eventAggregates;
    else if (needEvents) res.events = events;

    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}

// ---------- PATCH (부분 업데이트) ----------
const updateStoreBodySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().min(1).optional(),
  category: z.string().optional(),
  storeThumbnail: z.string().url().optional(),
  menuCategory: z.array(z.string()).optional(),
  partnership: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'Empty patch' });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = await createClient();
  const storeRepo = new SupabaseStoreRepository(sb);

  try {
    // 인증 & 권한
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const store = await storeRepo.getById(params.id);
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 입력 검증
    const json = await req.json();
    const patch = updateStoreBodySchema.parse(json);

    // 엔티티에 반영 (mutate 후 update)
    if (patch.name !== undefined) store.name = patch.name;
    if (patch.address !== undefined) store.address = patch.address;
    if (patch.lat !== undefined) (store as any).lat = patch.lat;        // lat/lng는 readonly로 두셨다면 setter를 추가하세요.
    if (patch.lng !== undefined) (store as any).lng = patch.lng;
    if (patch.phone !== undefined) store.phone = patch.phone;
    if (patch.category !== undefined) store.category = patch.category;
    if (patch.storeThumbnail !== undefined) store.storeThumbnail = patch.storeThumbnail;
    if (patch.menuCategory !== undefined) store.menuCategory = patch.menuCategory;
    if (patch.partnership !== undefined) store.partnership = patch.partnership;
    if (patch.isActive !== undefined) store.isActive = patch.isActive;

    await storeRepo.update(store);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid payload', issues: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}

// ---------- DELETE ----------
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const sb = await createClient();
  const storeRepo = new SupabaseStoreRepository(sb);

  try {
    // 인증 & 권한
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const store = await storeRepo.getById(params.id);
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await storeRepo.delete(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}