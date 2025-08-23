// app/api/stores/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store-repository.supabase';
import { SupabaseEventAggregateRepository } from '@/infra/supabase/repository/event-repository.supabase';
import { z } from 'zod';
import { Store } from '@/domain/store/store.entity';

// ----- GET -----
const parseBool = (v?: string | null) => v === '1' || v === 'true' || v === 'on';
const parseIntOr = (v: string | null, d: number) => {
  const n = Number(v); return Number.isFinite(n) ? n : d;
};
const parseCSV = (v?: string | null) =>
  (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

// (선택) Store → DTO
function toStoreDto(s: {
  id: string; name: string; address: string; lat: number; lng: number;
  phone: string; createdAt: string; category: string; isActive: boolean;
  storeThumbnail: string; ownerId: string; menuCategory: string[]; partnership: string | null;
}) { return { ...s }; }

// GET /api/stores?...&withStats=events,activeEvents
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

  const withStats = new Set(parseCSV(url.searchParams.get('withStats')));
  const needHasEvents        = withStats.has('events');
  const needHasActiveEvents  = withStats.has('activeEvents');

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

    // ---- 여기서 “레포지토리”를 통해 이벤트 존재 여부 계산 ----
    if (data.length && (needHasEvents || needHasActiveEvents)) {
      // 각 스토어별 카운트를 레포에서 가져와서 플래그로 변환
      const tasks = data.map(async (s) => {
        const [allCnt, activeCnt] = await Promise.all([
          needHasEvents
            ? eventAggRepo.countEventsByStore(s.id)  // 전체
            : Promise.resolve(0),
          needHasActiveEvents
            ? eventAggRepo.countEventsByStore(s.id, { isActive: true }) // 활성만
            : Promise.resolve(0),
        ]);
        return { id: s.id, hasEvents: allCnt > 0, hasActiveEvents: activeCnt > 0 };
      });

      const stats = await Promise.all(tasks);
      const byId = new Map(stats.map(x => [x.id, x]));

      for (const s of data as Array<typeof data[number] & { hasEvents?: boolean; hasActiveEvents?: boolean }>) {
        const st = byId.get(s.id);
        if (!st) continue;
        if (needHasEvents) s.hasEvents = st.hasEvents;
        if (needHasActiveEvents) s.hasActiveEvents = st.hasActiveEvents;
      }
    }
    // ------------------------------------------------------

    const meta = {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
      sort: { field, order },
      filter,
      withStats: Array.from(withStats),
    };

    return NextResponse.json({ data, meta });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
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