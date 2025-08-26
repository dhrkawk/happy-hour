// app/store/[id]/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Gift, Percent, Users, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { useGetStoreWithEventsAndMenus } from '@/hooks/usecases/stores.usecase';
import { useGetEventWithDiscountsAndGifts } from '@/hooks/usecases/events.usecase';
import { buildStoreDetailVM, type StoreDetailVM, type MenuVM } from '@/lib/vm/store.vm';

type EventType = 'discount' | 'gift' | 'combo';

const getEventIcon = (t: EventType) =>
  t === 'gift' ? <Gift className="w-4 h-4" /> :
  t === 'combo' ? <Users className="w-4 h-4" /> :
  <Percent className="w-4 h-4" />;

const getTimeLeft = (endDate: string) => {
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return '종료';
  if (days === 1) return '오늘 마감';
  return `${days}일 남음`;
};

export default function StorePage() {
  const { id } = useParams<{ id: string }>();

  // 1) 스토어 + 메뉴 + 이벤트(헤더만)
  const { data: detail, isLoading, error } = useGetStoreWithEventsAndMenus(id, { onlyActiveEvents: true });
  const vm: StoreDetailVM | null = useMemo(() => (detail ? buildStoreDetailVM(detail) : null), [detail]);

  // 선택 상태
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedGiftId, setSelectedGiftId] = useState('');

  // 2) 이벤트 상세(선택 시에만)
  const { data: eventDetail } = useGetEventWithDiscountsAndGifts(selectedEventId, {
    onlyActive: true,
    enabled: !!selectedEventId,
  });

  // 3) 이벤트 타입 추론
  const selectedEventType: EventType | null = useMemo(() => {
    if (!eventDetail) return null;
    const hasD = (eventDetail.discounts?.length ?? 0) > 0;
    const hasG = (eventDetail.giftOptions?.length ?? 0) > 0;
    if (hasD && hasG) return 'combo';
    if (hasD) return 'discount';
    if (hasG) return 'gift';
    return 'discount';
  }, [eventDetail]);

  // 4) (중요) MenuVM 그대로 쓰되, 할인 정보는 렌더링 단계에서 적용
  //    discounts: [{ menu_id, final_price, discount_rate, ... }]
  const discountMap = useMemo(() => {
    const m = new Map<string, { finalPrice: number; rate: number }>();
    for (const d of eventDetail?.discounts ?? []) {
      // 엔티티/스키마에 맞게 키 이름 확인: menu_id / final_price / discount_rate
      if (d.menuId || (d as any).menu_id) {
        const menuId = d.menuId ?? (d as any).menu_id;
        const finalPrice = d.finalPrice ?? (d as any).final_price;
        const rate = d.discountRate ?? (d as any).discount_rate;
        if (typeof finalPrice === 'number' && typeof rate === 'number') {
          m.set(menuId, { finalPrice, rate });
        }
      }
    }
    return m;
  }, [eventDetail]);

  // 로딩/에러
  if (isLoading || !vm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">불러오는 중…</h1>
          <p className="text-gray-600">가게 정보를 준비하고 있어요</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">가게를 찾을 수 없습니다</h1>
          <Link href="/home">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasPartnership = !!vm.partnership;

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-20 border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">가게 정보</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 상단 이미지 & 기본 정보 */}
      <div className="relative">
        <div className="h-64 bg-gray-200 relative overflow-hidden">
          <img
            src={vm.storeThumbnail || '/placeholder.svg'}
            alt={vm.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>

      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-2xl font-bold text-gray-800">{vm.name}</h1>
              {hasPartnership && (
                <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">제휴</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{vm.address}</span>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-600">{vm.category}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 이벤트/증정 선택 + 메뉴 */}
      <div className="px-4 py-6 pb-24">
        {vm.events.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">이벤트 선택</h3>

            {/* 이벤트 선택 */}
            <div className="relative mb-3">
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelectedGiftId(''); // 이벤트 바꾸면 증정 선택 초기화
                }}
                className="w-full p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-medium appearance-none cursor-pointer hover:border-blue-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="">이벤트를 선택하세요</option>
                {vm.events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                    {typeof ev.maxDiscountRate === 'number' && ev.maxDiscountRate > 0
                      ? ` - 최대 ${ev.maxDiscountRate}%`
                      : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* 이벤트 상세 요약 */}
            {selectedEventId && eventDetail && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">{eventDetail.event.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-600 text-white flex items-center gap-1">
                        {getEventIcon(selectedEventType ?? 'discount')}
                        {selectedEventType === 'discount' &&
                          `할인 적용 (${eventDetail.discounts?.length ?? 0} 메뉴)`}
                        {selectedEventType === 'gift' &&
                          `증정 (${eventDetail.giftOptions?.length ?? 0} 옵션)`}
                        {selectedEventType === 'combo' && `할인 + 증정`}
                      </Badge>
                      <div className="flex items-center gap-1 text-orange-600 font-medium">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{getTimeLeft(eventDetail.event.endDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 증정 옵션 선택 (있을 때만) */}
                {(eventDetail.giftOptions?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-700 mb-1">증정 선택</label>
                    <div className="relative">
                      <select
                        value={selectedGiftId}
                        onChange={(e) => setSelectedGiftId(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-800 appearance-none hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">선택하세요</option>
                        {eventDetail.giftOptions!.map((go) => (
                          <option key={go.id} value={go.id}>
                            {go.menuName ?? '증정 메뉴'}
                            {go.remaining != null ? ` (잔여 ${go.remaining})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 메뉴 리스트 (MenuVM 그대로, 할인은 렌더링에서 계산) */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 mb-6">메뉴</h3>
          {vm.menus.map((m: MenuVM) => {
            const d = discountMap.get(m.id); // { finalPrice, rate } | undefined
            const showDiscount = !!d && d.finalPrice < m.price;

            return (
              <Card key={m.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg mb-2">{m.name}</h4>
                      {m.description && <p className="text-gray-600 mb-4">{m.description}</p>}
                      <div className="flex items-center gap-3">
                        {showDiscount ? (
                          <>
                            <span className="text-gray-400 line-through font-medium">
                              {m.price.toLocaleString()}원
                            </span>
                            <span className="text-xl font-bold text-blue-600">
                              {d!.finalPrice.toLocaleString()}원
                            </span>
                            {typeof d!.rate === 'number' && (
                              <Badge className="bg-blue-600 text-white font-medium">
                                {d!.rate}% 할인
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xl font-bold text-gray-900">
                            {m.price.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    </div>
                    {m.thumbnail && (
                      <img
                        src={m.thumbnail}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}