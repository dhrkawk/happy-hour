// app/api/events/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/shared/server';
import { SupabaseEventAggregateRepository } from '@/infra/supabase/repository/event-repository.supabase';

const parseBool = (v?: string | null) => v === '1' || v === 'true' || v === 'on';
const parseCSV  = (v?: string | null) => (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const include = new Set(parseCSV(url.searchParams.get('include'))); // discounts,gifts
  const childActive = parseBool(url.searchParams.get('childActive')); // 하위 활성만 필터

  const needDiscounts = include.has('discounts') || include.size === 0; // 기본: 둘 다
  const needGifts     = include.has('gifts')     || include.size === 0;

  const sb = await createClient();
  const repo = new SupabaseEventAggregateRepository(sb);

  try {
    // 1) 이벤트 헤더 단건 조회 (store_id 확보용)
    //    getEventHeaderById 가 없다면, 해당 리포지토리에 추가하는 것을 권장합니다.
    const {id} = await params;
    const ev = await repo.getEventHeaderById(id);
    if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 2) 같은 스토어의 이벤트 aggregate를 모두 로드한 뒤, 대상 event.id만 필터
    //    (리포지토리 시그니처 예시: listAggregatesByStore(storeId, page, sort, filter))
    const aggs = await repo.listAggregatesByStore(
      ev.storeId,
      undefined,
      { field: 'created_at', order: 'desc' },
      // 필요 시 헤더 수준 필터(fromDate/toDate/weekday 등) 추가 가능
      undefined
    );

    const agg = (aggs ?? []).find(a => a.event.id === ev.id);
    if (!agg) {
      // 헤더는 있는데 aggregate 조립 대상이 없을 수 있음(할인/증정이 전무한 경우)
      return NextResponse.json({ event: ev, discounts: [], giftGroups: [] });
    }

    // 3) include / childActive 반영
    const discounts = needDiscounts
      ? (childActive ? agg.discounts.filter(d => d.isActive === true) : agg.discounts)
      : undefined;

    const giftGroups = needGifts
      ? (childActive
          ? agg.giftGroups.map(g => ({
              group: g.group,
              options: g.options.filter(o => o.isActive === true),
            }))
          : agg.giftGroups)
      : undefined;

    // 4) 응답
    return NextResponse.json({
      event: agg.event,          // 헤더(상세 설명 포함 시 repo에서 채워주세요)
      ...(needDiscounts ? { discounts } : {}),
      ...(needGifts ? { giftGroups } : {}),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}