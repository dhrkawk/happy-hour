// app/api/stores/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store-repository.supabase';
import { SupabaseEventAggregateRepository } from '@/infra/supabase/repository/event-repository.supabase';
import { z } from 'zod';

// ----- GET -----

const parseBool = (v?: string | null) => v === '1' || v === 'true' || v === 'on';
const parseIntOr = (v: string | null, d: number) => {
  const n = Number(v); return Number.isFinite(n) ? n : d;
};
const parseCSV = (v?: string | null) =>
  (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

function toStoreDto(s: {
  id: string; name: string; address: string; lat: number; lng: number;
  phone: string; createdAt: string; category: string; isActive: boolean;
  storeThumbnail: string; ownerId: string; menuCategory: string[]; partnership: string | null;
}) { return { ...s }; }

// snake_case | camelCase 아무거나 와도 안전하게 뽑기
const pick = <T = any>(obj: any, ...keys: string[]): T | undefined => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null) return v as T;
  }
  return undefined;
};

// 이벤트 Row → 클라 헤더 DTO(camelCase)
const mapEventHeader = (e: any) => ({
  id: e.id,
  title: e.title ?? '',
  startDate: pick<string>(e, 'startDate', 'start_date'),
  endDate: pick<string>(e, 'endDate', 'end_date'),
  weekdays: pick<string[]>(e, 'weekdays') ?? [],
  isActive: pick<boolean>(e, 'isActive', 'is_active') ?? true,
  happyHourStartTime: pick<string>(e, 'happyHourStartTime', 'happyhour_start_time', 'happy_hour_start_time') ?? null,
  happyHourEndTime:   pick<string>(e, 'happyHourEndTime',   'happyhour_end_time',   'happy_hour_end_time') ?? null,
  maxDiscountRate:    pick<number | null>(e, 'maxDiscountRate', 'max_discount_rate') ?? null,
  maxFinalPrice:      pick<number | null>(e, 'maxFinalPrice',   'max_final_price') ?? null,
  maxOriginalPrice:   pick<number | null>(e, 'maxOriginalPrice','max_original_price') ?? null,
});

export async function GET(req: Request) {
  const url = new URL(req.url);

  const ownerId  = url.searchParams.get('ownerId') ?? undefined;
  const isActive = url.searchParams.get('isActive');
  const category = url.searchParams.get('category') ?? undefined;
  const search   = url.searchParams.get('search') ?? undefined;

  const limit  = parseIntOr(url.searchParams.get('limit'), 20);
  const offset = parseIntOr(url.searchParams.get('offset'), 0);

  const sortParam = url.searchParams.get('sort') ?? 'created_at:desc';
  const [fieldRaw, orderRaw] = sortParam.split(':');
  const field = (fieldRaw === 'name' ? 'name' : 'created_at') as 'created_at' | 'name';
  const order = (orderRaw === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const include = new Set(parseCSV(url.searchParams.get('include'))); // include=events
  const includeEvents = include.has('events');

  const eventIsActive = url.searchParams.get('eventIsActive');
  const onlyActiveEvents = eventIsActive == null ? true : parseBool(eventIsActive); // 기본 활성만

  const sb = await createClient();
  const storeRepo = new SupabaseStoreRepository(sb);
  const eventAggRepo = new SupabaseEventAggregateRepository(sb);

  try {
    const filter = {
      ownerId,
      isActive: isActive == null ? undefined : parseBool(isActive),
      category,
      searchName: search,
    };

    const [total, stores] = await Promise.all([
      storeRepo.count(filter),
      storeRepo.list(filter, { limit, offset }, { field, order }),
    ]);

    const data = stores.map(toStoreDto);

    if (includeEvents && data.length) {
      const storeIds = data.map(s => s.id);

      // 이벤트 rows 로드
      const grouped = await eventAggRepo.listEventsByStoreIds(
        storeIds,
        { field: 'created_at', order: 'desc' },
        { isActive: onlyActiveEvents ? true : undefined }
      );

      // storeId -> (camelCase 변환된) events
      const byId = new Map(
        grouped.map(g => [g.storeId, g.events.map(mapEventHeader)])
      );

      for (const s of data as Array<typeof data[number] & { events?: any[] }>) {
        s.events = byId.get(s.id) ?? [];
      }
    }

    const meta = {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
      sort: { field, order },
      filter,
      include: Array.from(include),
      eventFilter: includeEvents ? { isActive: onlyActiveEvents } : undefined,
    };

    return NextResponse.json({ data, meta });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


// ----- POST -----
// (서버측 보안용 입력 스키마: 클라이언트 Form과 동일 구조)
const createStoreBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().min(1),
  category: z.string().optional(),
  storeThumbnail: z.string().url(),
  menuCategory: z.array(z.string()).optional(),
  partnership: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    // 1) 인증 유저 확인 (RLS 정책을 쓴다면 특히 중요)
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2) 바디 파싱/검증
    const json = await req.json();
    const body = createStoreBodySchema.parse(json);
    // 3) 엔티티 생성 (서버에서 필요한 값 주입)
    const id = await repo.create({
      name: body.name,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      phone: body.phone,
      created_at: new Date().toISOString(),
      category: body.category ?? '',
      is_active: true, // 신규 기본 활성화(정책에 맞게 조정 가능)
      store_thumbnail: body.storeThumbnail,
      owner_id: user.id,                 // ← 서버에서 주입
      menu_category: body.menuCategory ?? [],
      partnership: body.partnership ?? null,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid payload', issues: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}