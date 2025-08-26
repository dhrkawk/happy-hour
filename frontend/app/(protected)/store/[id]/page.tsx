// app/store/[id]/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Gift, Percent } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { useGetStoreDetail } from '@/hooks/usecases/stores.usecase';
import type { StoreDetailVM, MenuWithDiscountVM } from '@/lib/vm/store.vm';

function getTimeLeft(endDate: string) {
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return '종료';
  if (days === 1) return '오늘 마감';
  return `${days}일 남음`;
}

export default function StorePage() {
  const { id } = useParams<{ id: string }>();

  // 하나의 훅으로: base + event 상세까지 enrich된 VM
  const { data: vm, isLoading, error } = useGetStoreDetail(id, {onlyActive: true,});

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

  const hasPartnership = !!vm.partershipText;

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
            src={vm.thumbnail || '/placeholder.svg'}
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
                <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">
                  제휴
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{vm.address}</span>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-600">{vm.category}</Badge>
            </div>
            <div className="text-sm text-gray-500">
              {typeof vm.distanceText === 'string' ? vm.distanceText : '거리 정보 없음'}
            </div>
          </div>
        </div>
      </div>

      {/* 선택/장바구니 로직 제거: 현재 선택된(또는 대표) 이벤트만 요약 표시 */}
      {vm.event && (
        <div className="px-4 pt-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-700" />
                <h4 className="font-bold text-blue-900">{vm.event.title}</h4>
              </div>
              <div className="flex items-center gap-1 text-orange-600 font-medium">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{getTimeLeft(vm.event.endDate)}</span>
              </div>
            </div>
            {vm.event.description && (
              <p className="text-sm text-blue-900 mt-2">{vm.event.description}</p>
            )}
          </div>
        </div>
      )}

      {/* 메뉴 리스트 (enrich로 주입된 할인 필드를 그대로 사용) */}
      <div className="px-4 py-6 pb-24">
        <h3 className="text-xl font-bold text-gray-800 mb-6">메뉴</h3>
        <div className="space-y-4">
          {vm.menus.map((m: MenuWithDiscountVM) => {
            const showDiscount =
              typeof m.finalPrice === 'number' &&
              Number.isFinite(m.finalPrice) &&
              m.finalPrice! < m.price;

            return (
              <Card key={m.menuId} className="border-gray-200">
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
                              {m.finalPrice!.toLocaleString()}원
                            </span>
                            {typeof m.discountRate === 'number' && (
                              <Badge className="bg-blue-600 text-white font-medium">
                                {m.discountRate}% 할인
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

        {/* 증정(선택 없이 목록만 노출) */}
        {(vm.gifts?.length ?? 0) > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4">증정</h3>
            <div className="space-y-3">
              {vm.gifts.map(g => (
                <div
                  key={g.gitfOptionId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-green-700" />
                    <div>
                      <div className="font-medium text-gray-900">{g.name}</div>
                      {g.description && (
                        <div className="text-sm text-gray-600">{g.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {g.remaining != null ? `잔여 ${g.remaining}` : '재고 정보 없음'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}