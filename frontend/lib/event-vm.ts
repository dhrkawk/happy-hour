// hooks/events/events-vm.ts
import type {
    EventsListResponse,
    EventsListResponse_Aggregate,
    EventsListResponse_Light,
    ApiEvent,
    ApiEventAggregate,
  } from '@/hooks/events/use-get-events';
  
  const weekdayLabel: Record<string,string> = {
    MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
    Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일',
    mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일',
  };
  
  const fmtDate = (ymd: string) => /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd.replace(/-/g, '.') : ymd;
  const fmtTime = (hhmmss?: string) => (hhmmss ? hhmmss.slice(0,5) : undefined);
  
  export type EventListItemVM = {
    id: string;
    title: string;
    description?: string | null;
    periodText: string;          // "YYYY.MM.DD ~ YYYY.MM.DD"
    weekdaysText?: string;       // "월, 화, 수"
    happyHourText?: string;      // "HH:mm ~ HH:mm"
    isActive: boolean;
    createdAtText: string;
  
    // 집계 정보(있을 때만)
    discountSummary?: {
      count: number;
      maxRate?: number | null;
      maxFinal?: number | null;
      maxOriginal?: number | null;
    };
    giftSummary?: {
      groupCount: number;
      optionCount: number;
    };
  };
  
  export type EventsListVM = {
    items: EventListItemVM[];
    total: number;
    hasMore: boolean;
  };
  
  function baseToVM(ev: ApiEvent): Omit<EventListItemVM, 'discountSummary'|'giftSummary'> {
    const periodText = `${fmtDate(ev.start_date)} ~ ${fmtDate(ev.end_date)}`;
    const weekdaysText = ev.weekdays?.length
      ? ev.weekdays.map(w => weekdayLabel[w] ?? w).join(', ')
      : undefined;
    const happyHourText =
      ev.happy_hour_start_time && ev.happy_hour_end_time
        ? `${fmtTime(ev.happy_hour_start_time)} ~ ${fmtTime(ev.happy_hour_end_time)}`
        : undefined;
  
    return {
      id: ev.id,
      title: ev.title,
      description: ev.description ?? null,
      periodText,
      weekdaysText,
      happyHourText,
      isActive: ev.is_active,
      createdAtText: new Date(ev.created_at).toLocaleString('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };
  }
  
  export const buildEventsListVM = (resp: EventsListResponse): EventsListVM => {
    const meta = resp.meta ?? ({} as any);
  
    // 라이트 모드
    if ((resp as EventsListResponse_Light).data?.length && 'store_id' in (resp as EventsListResponse_Light).data[0]) {
      const items = (resp as EventsListResponse_Light).data.map(ev => baseToVM(ev));
      return {
        items,
        total: meta.total ?? items.length,
        hasMore: Boolean(meta.hasMore),
      };
    }
  
    // 어그리게이트 모드
    const aggs = (resp as EventsListResponse_Aggregate).data ?? [];
    const items = aggs.map((a: ApiEventAggregate) => {
      const vm = baseToVM(a.event);
  
      // discount summary
      const dCount = a.discounts?.length ?? 0;
      const dMaxRate = a.event.max_discount_rate ?? null;
      const dMaxFinal = a.event.max_final_price ?? null;
      const dMaxOrig  = a.event.max_original_price ?? null;
  
      // gift summary
      const gCount = a.giftGroups?.length ?? 0;
      const oCount = a.giftGroups?.reduce((acc, g) => acc + (g.options?.length ?? 0), 0) ?? 0;
  
      return {
        ...vm,
        discountSummary: {
          count: dCount,
          maxRate: dMaxRate,
          maxFinal: dMaxFinal,
          maxOriginal: dMaxOrig,
        },
        giftSummary: {
          groupCount: gCount,
          optionCount: oCount,
        },
      } as EventListItemVM;
    });
  
    return {
      items,
      total: meta.total ?? items.length,
      hasMore: Boolean(meta.hasMore),
    };
  };