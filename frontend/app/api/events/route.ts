// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store-repository.supabase';
import { SupabaseEventAggregateRepository } from '@/infra/supabase/repository/event-repository.supabase';

// 도메인 엔티티
import { Event } from '@/domain/event/event.entity';
import { Discount } from '@/domain/discount/discount.entity';
import { GiftGroup } from '@/domain/gift/gift-group.entity';
import { GiftOption } from '@/domain/gift/gift-option.entity';

const parseBool = (v?: string | null) => v === '1' || v === 'true' || v === 'on';
const parseIntOr = (v: string | null, d: number) => {
  const n = Number(v); return Number.isFinite(n) ? n : d;
};
const parseCSV = (v?: string | null) =>
  (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

// 정렬 파싱
function parseSort(raw?: string | null) {
  const s = raw ?? 'created_at:desc';
  const [fieldRaw, orderRaw] = s.split(':');
  const field = (['created_at','start_date','end_date','title'].includes(fieldRaw)
    ? (fieldRaw as 'created_at'|'start_date'|'end_date'|'title')
    : 'created_at');
  const order = (orderRaw === 'asc' ? 'asc' : 'desc') as 'asc'|'desc';
  return { field, order };
}

// ---------- GET ----------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sb = await createClient();

  try {
    // 1) 인증
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2) 파라미터
    const storeId = url.searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

    const include = new Set(parseCSV(url.searchParams.get('include'))); // aggregate
    const needAggregate = include.has('aggregate');

    const isActive = url.searchParams.get('isActive');
    const fromDate = url.searchParams.get('fromDate') ?? undefined; // YYYY-MM-DD
    const toDate   = url.searchParams.get('toDate') ?? undefined;
    const weekdaysRaw = parseCSV(url.searchParams.get('weekdays'));
    const weekdays = weekdaysRaw.length ? weekdaysRaw.map(w => w.toUpperCase()) : undefined;

    const limit  = parseIntOr(url.searchParams.get('limit'), 20);
    const offset = parseIntOr(url.searchParams.get('offset'), 0);
    const { field, order } = parseSort(url.searchParams.get('sort'));

    const childActive = parseBool(url.searchParams.get('childActive')); // aggregate일 때만 사용

    const storeRepo = new SupabaseStoreRepository(sb);
    const eventAggRepo = new SupabaseEventAggregateRepository(sb);

    // 3) 권한 체크(스토어 오너 or admin)
    const store = await storeRepo.getById(storeId);
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    const isAdmin = (user.app_metadata as any)?.role === 'admin';
    if (!isAdmin && store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4) 조회
    if (needAggregate) {
      // 무거운 조회(aggregate) — 목록에서 모두 필요할 때만 사용 권장
      const aggs = await eventAggRepo.listAggregatesByStore(
        storeId,
        { limit, offset },
        { field, order },
        {
          isActive: isActive == null ? undefined : parseBool(isActive),
          fromDate,
          toDate,
          weekdays,
        }
      );

      // childActive=true면 discount/gift option 활성만 필터
      const data = childActive
        ? aggs.map(a => ({
            event: a.event,
            discounts: a.discounts.filter(d => d.isActive === true),
            giftGroups: a.giftGroups.map(g => ({
              group: g.group,
              options: g.options.filter(o => o.isActive === true),
            })),
          }))
        : aggs;

      // total을 정확히 내려주려면 count API가 필요하지만,
      // 간단히 offset/limit 기반 hasMore 추정 혹은 countEventsByStore 사용
      const total = await eventAggRepo.countEventsByStore(
        storeId,
        {
          isActive: isActive == null ? undefined : parseBool(isActive),
          fromDate,
          toDate,
          weekdays,
        }
      );

      return NextResponse.json({
        data,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + data.length < total,
          sort: { field, order },
          filter: {
            storeId,
            isActive: isActive == null ? undefined : parseBool(isActive),
            fromDate,
            toDate,
            weekdays,
          },
          include: Array.from(include),
          childActive,
        },
      });
    } else {
      // 라이트 조회(이벤트 헤더만)
      const events = await eventAggRepo.listEventsByStore(
        storeId,
        { limit, offset },
        { field, order },
        {
          isActive: isActive == null ? undefined : parseBool(isActive),
          fromDate,
          toDate,
          weekdays,
        }
      );

      const total = await eventAggRepo.countEventsByStore(
        storeId,
        {
          isActive: isActive == null ? undefined : parseBool(isActive),
          fromDate,
          toDate,
          weekdays,
        }
      );

      return NextResponse.json({
        data: events,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + events.length < total,
          sort: { field, order },
          filter: {
            storeId,
            isActive: isActive == null ? undefined : parseBool(isActive),
            fromDate,
            toDate,
            weekdays,
          },
          include: Array.from(include),
        },
      });
    }
  } catch (e: any) {
    const msg = e?.message ?? 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


// ---------- 유틸 ----------
const TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/; // HH:mm | HH:mm:ss
const DATE = /^\d{4}-\d{2}-\d{2}$/;                         // YYYY-MM-DD
const weekdaysEnum = z.enum(['mon','tue','wed','thu','fri','sat','sun']);
const toHHMMSS = (t: string) => t.length === 5 ? `${t}:00` : t;

// ---------- 입력 스키마 ----------
const createEventSchema = z.object({
  event: z.object({
    storeId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().max(2000).nullable().optional(),
    startDate: z.string().regex(DATE),
    endDate: z.string().regex(DATE),
    weekdays: z.array(weekdaysEnum).min(1).max(7).optional(), // 없으면 요일 제한 없음
    happyHourStartTime: z.string().regex(TIME),
    happyHourEndTime: z.string().regex(TIME),
    isActive: z.boolean().optional(), // default: true
  })
  .refine(v => v.endDate >= v.startDate, { message: 'endDate must be >= startDate', path: ['endDate'] })
  .refine(v => {
    const a = !!v.happyHourStartTime, b = !!v.happyHourEndTime;
    return (a && b) || (!a && !b);
  }, { message: 'happyHourStartTime and happyHourEndTime must be provided together' }),

  // 선택: 할인들
  discounts: z.array(z.object({
    menuId: z.string().uuid(),
    discountRate: z.number().int().min(0).max(100),
    finalPrice: z.number().int().min(0),
    remaining: z.number().int().min(0).nullable().optional(),
    isActive: z.boolean().optional(), // default: true
  })).optional(),

  // 선택: 기프트 그룹들(그룹당 옵션들)
  giftGroups: z.array(z.object({
    options: z.array(z.object({
      menuId: z.string().uuid(),
      remaining: z.number().int().min(0).nullable().optional(),
      isActive: z.boolean().optional(), // default: true
    })).min(1),
  })).optional(),
});

export async function POST(req: Request) {
  const sb = await createClient();
  const storeRepo = new SupabaseStoreRepository(sb);
  const eventAggRepo = new SupabaseEventAggregateRepository(sb);

  try {
    // 1) 인증
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2) 입력 검증
    const parsed = createEventSchema.parse(await req.json());
    const { event: ev, discounts = [], giftGroups = [] } = parsed;

    // 3) 권한(스토어 소유자 or admin)
    const store = await storeRepo.getById(ev.storeId);
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    const isAdmin = (user.app_metadata as any)?.role === 'admin';
    if (!isAdmin && store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4) ID를 서버에서 선생성하여 관계를 미리 연결
    const eventId = crypto.randomUUID();

    // Event 엔티티
    const eventEntity = Event.create({
      id: eventId, // ← 서버에서 생성 (DB PK가 client-supplied UUID 허용이어야 함)
      store_id: ev.storeId,
      title: ev.title,
      description: ev.description ?? null,
      start_date: ev.startDate,
      end_date: ev.endDate,
      weekdays: ev.weekdays ?? [],
      happy_hour_start_time: toHHMMSS(ev.happyHourStartTime),
      happy_hour_end_time: toHHMMSS(ev.happyHourEndTime),
      is_active: ev.isActive ?? true,
      created_at: new Date().toISOString(),
      // max_* 필드는 할인 집계로 별도 계산/관리한다면 null
      max_discount_rate: null,
      max_final_price: null,
      max_original_price: null,
    });

    // Discount 엔티티들
    const discountEntities = discounts.map(d =>
      Discount.create({
        id: crypto.randomUUID(),
        event_id: eventId,                // ← 관계 연결
        menu_id: d.menuId,
        discount_rate: d.discountRate,
        final_price: d.finalPrice,
        remaining: d.remaining ?? null,
        is_active: d.isActive ?? true,
        created_at: new Date().toISOString(),
      })
    );

    // Gift Group / Option 엔티티들
    const giftGroupAggregates = giftGroups.map(g => {
      const gid = crypto.randomUUID();
      const group = GiftGroup.create({
        id: gid,
        event_id: eventId,               // ← 관계 연결
        created_at: new Date().toISOString(),
      });
      const options = g.options.map(o =>
        GiftOption.create({
          id: crypto.randomUUID(),
          gift_group_id: gid,            // ← 그룹과 연결
          menu_id: o.menuId,
          remaining: o.remaining ?? null,
          is_active: o.isActive ?? true,
          created_at: new Date().toISOString(),
        })
      );
      return { group, options };
    });

    // 5) 원자적 생성 (RPC: create_event_aggregate)
    await eventAggRepo.create({
      event: eventEntity,
      discounts: discountEntities,
      giftGroups: giftGroupAggregates,
    });

    // 6) 성공 응답 (서버가 만든 eventId 반환)
    return NextResponse.json({ id: eventId }, { status: 201 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid payload', issues: e.issues }, { status: 400 });
    }
    // Supabase 에러 메시지 그대로 전달
    const msg = e?.message ?? 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}