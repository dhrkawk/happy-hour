// app/api/stores/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseStoreRepository } from '@/infra/supabase/repository/store-repository.supabase';

// 쿼리 파라미터 유틸 (간단 버전)
const parseBool = (v?: string | null) =>
  v === '1' || v === 'true' || v === 'on';
const parseIntOr = (v: string | null, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// (선택) Store → DTO. 지금은 엔티티 그대로 내보내도 되지만,
// 프론트 최적화나 숨길 필드가 있으면 여기서 변환.
function toStoreDto(s: {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  createdAt: string;
  category: string;
  isActive: boolean;
  storeThumbnail: string;
  ownerId: string;
  menuCategory: string[];
  partnership: string | null;
}) {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    phone: s.phone,
    createdAt: s.createdAt,
    category: s.category,
    isActive: s.isActive,
    storeThumbnail: s.storeThumbnail,
    ownerId: s.ownerId,
    menuCategory: s.menuCategory,
    partnership: s.partnership,
  };
}

// GET /api/stores?ownerId=&isActive=&category=&search=&limit=&offset=&sort=created_at:desc
export async function GET(req: Request) {
  const url = new URL(req.url);

  const ownerId  = url.searchParams.get('ownerId') ?? undefined;
  const isActive = url.searchParams.get('isActive');
  const category = url.searchParams.get('category') ?? undefined;
  const search   = url.searchParams.get('search') ?? undefined;

  const limit  = parseIntOr(url.searchParams.get('limit'), 20);
  const offset = parseIntOr(url.searchParams.get('offset'), 0);

  // sort 형식: "field:asc|desc" (기본: created_at:desc)
  const sortParam = url.searchParams.get('sort') ?? 'created_at:desc';
  const [fieldRaw, orderRaw] = sortParam.split(':');
  const field = (fieldRaw === 'name' ? 'name' : 'created_at') as 'created_at' | 'name';
  const order = (orderRaw === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const sb = await createClient();
  const repo = new SupabaseStoreRepository(sb);

  try {
    // 필터 구성
    const filter = {
      ownerId,
      isActive: isActive == null ? undefined : parseBool(isActive),
      category,
      searchName: search,
    };

    // 총 개수(페이지네이션용)
    const total = await repo.count(filter);

    // 목록
    const stores = await repo.list(
      filter,
      { limit, offset },
      { field, order }
    );

    // DTO 변환 (원하면 그냥 stores 리턴해도 OK)
    const data = stores.map(toStoreDto);

    const meta = {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
      sort: { field, order },
      filter,
    };

    return NextResponse.json({ data, meta });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Internal error' },
      { status: 500 }
    );
  }
}