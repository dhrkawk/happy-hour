// app/store/[id]/page.tsx (예시 경로)
// "use client"
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Share2, Heart, Phone, Plus, Minus, Loader2, Calendar, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useAppContext } from '@/contexts/app-context';
import { useGiftContext } from '@/contexts/gift-context';

import { useGetStoreDetail, includeFullAggregate } from '@/hooks/stores/use-get-store-detail';
import { buildStoreDetailVM, type StoreDetailViewModel, type StoreMenuViewModel } from '@/lib/store-detail-vm';

export default function StorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const { appState, addToCart, updateItemQuantity, removeFromCart, getCartTotals, clearCart } = useAppContext();
  const { location, cart } = appState;
  const { coordinates } = location;

  const {
    selectGift,
    unselectGift,
    getSelectedMenuId,
    clearStoreGifts,
    activeGiftStoreId,
  } = useGiftContext();

  // 서버에서: 메뉴 + 이벤트 + 할인 + 기프트 한 번에
  const { data, isLoading, error } = useGetStoreDetail(
    includeFullAggregate(storeId, true),
    { select: (raw) => buildStoreDetailVM(raw, coordinates) }
  );

  const viewmodel = data as StoreDetailViewModel | undefined;

  // 탭/카테고리 상태
  const [activeTab, setActiveTab] = useState<'menu' | 'info'>('menu');
  const [isLiked, setIsLiked] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string | null>(null);

  // 섹션 스크롤 포커스용 ref
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 카테고리별 메뉴 묶기 (할인/기타는 VM에서 상수로 쓰기보단 여기서 분류)
  const categorizedMenus = useMemo(() => {
    const g: Record<string, StoreMenuViewModel[]> = {};
    if (!viewmodel) return g;

    // "할인" 섹션: 할인률 > 0
    g['할인'] = viewmodel.menus.filter(m => (m.discountRate ?? 0) > 0);

    // 지정 카테고리 섹션
    for (const c of viewmodel.menuCategories) g[c] = [];
    for (const m of viewmodel.menus) {
      if (m.category && g[m.category]) g[m.category].push(m);
    }

    // "기타" 섹션: 할인 0이고 카테고리 없거나 지정 카테고리 밖
    g['기타'] = viewmodel.menus.filter(m => (m.discountRate ?? 0) === 0 && (!m.category || !g[m.category]));

    return g;
  }, [viewmodel]);

  // 증정 섹션 VM (이미 viewmodel.gifts로 계산되어 있음)
  const giftSections = viewmodel?.gifts ?? [];

  // 섹션 관찰로 선택 카테고리 갱신
  useEffect(() => {
    if (!viewmodel) return;

    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setSelectedMenuCategory(e.target.id)),
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    Object.keys(categorizedMenus).forEach((category) => {
      const ref = sectionRefs.current[category];
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.keys(categorizedMenus).forEach((category) => {
        const ref = sectionRefs.current[category];
        if (ref) observer.unobserve(ref);
      });
    };
  }, [categorizedMenus, viewmodel]);

  // 가게/증정 컨텍스트 정리
  useEffect(() => {
    if (!viewmodel) return;

    if (cart && cart.storeId !== viewmodel.id) {
      clearCart();
    }
    if (activeGiftStoreId && activeGiftStoreId !== viewmodel.id) {
      clearStoreGifts(activeGiftStoreId);
    }

    setSelectedMenuCategory('할인');
  }, [viewmodel, cart, clearCart, activeGiftStoreId, clearStoreGifts]);

  // 증정 토글
  const onToggleGiftCheckbox = (
    giftId: string,
    menu: StoreMenuViewModel,
    checked: boolean,
    meta: { displayNote?: string | null; endAt?: string | null; remaining?: number | null }
  ) => {
    if (!viewmodel) return;
    if (checked) {
      selectGift({
        storeId: viewmodel.id,
        giftId,
        menu: {
          id: menu.id,
          name: menu.name,
          thumbnail: menu.thumbnail,
          originalPrice: menu.originalPrice,
          description: menu.description,
          category: menu.category,
        },
        displayNote: meta.displayNote ?? null,
        endAt: meta.endAt ?? null,
        remaining: meta.remaining ?? null,
      });
    } else {
      unselectGift(viewmodel.id, giftId);
    }
  };

  // 카트 동작
  const handleAddToCart = (menu: StoreMenuViewModel) => {
    if (!viewmodel) return;
    const item = {
      menuId: menu.id,
      name: menu.name,
      price: menu.discountPrice,
      originalPrice: menu.originalPrice,
      thumbnail: menu.thumbnail ?? undefined,
    };
    // createCartItem을 쓰고 싶다면 기존 헬퍼에 맞춰 교체해도 OK
    addToCart({ id: viewmodel.id, name: viewmodel.name }, item);
  };

  const handleRemoveFromCart = (menuId: string) => {
    const current = getCartQuantity(menuId);
    if (current > 1) updateItemQuantity(menuId, current - 1);
    else removeFromCart(menuId);
  };

  const getCartQuantity = (menuId: string) =>
    appState.cart?.items.find(i => i.menuId === menuId)?.quantity ?? 0;

  const { totalItems, totalPrice } = getCartTotals();

  const handleReservation = () => {
    if (!appState.cart || appState.cart.items.length === 0) return;
    router.push(`/reservation/${appState.cart.storeId}`);
  };

  if (isLoading || !viewmodel) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">가게 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">가게를 찾을 수 없습니다</h1>
          <Link href="/">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 relative z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-gray-800">가게 정보</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2" onClick={() => setIsLiked(!isLiked)}>
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Thumbnail */}
      <div className="relative">
        <div className="h-64 bg-gray-200">
          <img
            src={viewmodel.storeThumbnail || '/no-image.jpg'}
            alt={viewmodel.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{viewmodel.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{viewmodel.distanceText ?? '거리 정보 없음'}</span>
              <span>•</span>
              <span>{viewmodel.category}</span>
            </div>

            {viewmodel.partnership ? (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm w-full">
                <div className="flex items-center gap-2">
                  <div className="text-blue-500 text-xl">🤝</div>
                  <div className="text-blue-900 font-semibold text-sm">제휴 매장</div>
                </div>
                <div className="text-blue-800 text-sm mt-2">
                  {viewmodel.partnership}
                </div>
              </div>
            ) : null}

            {viewmodel.events.length > 0 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-blue-500 text-xl">📣</div>
                  <div className="text-blue-900 font-semibold text-sm">이 매장의 진행 중인 이벤트</div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  {viewmodel.events.map((ev) => (
                    <div key={ev.id} className="bg-white border border-blue-100 rounded-lg p-3 shadow-sm">
                      <div className="font-semibold text-blue-800 text-sm">{ev.title}</div>
                      {ev.description && (
                        <div className="text-xs text-blue-700 mt-1">{ev.description}</div>
                      )}
                      <div className="text-xs text-blue-700 mt-2 flex flex-col gap-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ev.periodText}
                        </span>
                        {ev.happyHourText && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ev.happyHourText}
                          </span>
                        )}
                        {ev.weekdaysText && <span className="text-blue-600">{ev.weekdaysText}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* (선택) 설명이 있다면 표시하려면 viewmodel에 description을 추가하세요 */}
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'menu' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🍽️ 메뉴
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'info' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📍 정보
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-32">
        {activeTab === 'menu' && (
          <div className="space-y-3">
            {/* 증정 섹션 */}
            {giftSections.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">증정</h3>
                <div className="space-y-3">
                  {giftSections.map(section => {
                    const timeLeft = (() => {
                      const diff = new Date(section.endAt).getTime() - Date.now();
                      if (diff <= 0) return '마감';
                      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      if (d > 0) return `${d}일 남음`;
                      if (h > 0) return `${h}시간 남음`;
                      const m = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60));
                      return `${m}분 남음`;
                    })();

                    return (
                      <Card key={section.id} className="border-gray-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-semantic-gift-500 text-white text-xs">증정</Badge>
                              {section.displayNote && (
                                <span className="text-sm text-gray-700">{section.displayNote}</span>
                              )}
                              <span className="text-xs text-gray-500">(한 개 선택)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              {section.remaining != null && (
                                <span className="text-gray-600">남은 수량 {section.remaining}</span>
                              )}
                              <span className="text-red-500 font-medium">{timeLeft}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {section.menus.map(m => {
                              const checked = getSelectedMenuId(viewmodel.id, section.id) === m.id;
                              return (
                                <label
                                  key={m.id}
                                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition
                                    ${checked ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={checked}
                                    onChange={(e) =>
                                      onToggleGiftCheckbox(
                                        section.id,
                                        m,
                                        e.target.checked,
                                        { displayNote: section.displayNote, endAt: section.endAt, remaining: section.remaining }
                                      )
                                    }
                                  />
                                  <div className="w-14 h-14 flex-shrink-0">
                                    <img
                                      src={m.thumbnail || '/no-image.jpg'}
                                      alt={m.name}
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-gray-800">{m.name}</h4>
                                      <Badge className="bg-semantic-gift-500 text-white text-xs">증정</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm text-gray-400 line-through">
                                        {m.originalPrice.toLocaleString()}원
                                      </span>
                                      <span className="text-sm font-semibold text-teal-600">0원</span>
                                    </div>
                                    {m.description && (
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{m.description}</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="border-b-2 border-gray-200 my-4" />
              </div>
            )}

            {/* 카테고리 탭 (상단 고정) */}
            {viewmodel.menuCategories.length > 0 && (
              <div className="sticky top-0 bg-white z-10 py-2 border-b border-gray-100 -mx-4 px-4">
                <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
                  {['할인', ...viewmodel.menuCategories, '기타'].map((category) => (
                    <Button
                      key={category}
                      variant={selectedMenuCategory === category ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedMenuCategory(category);
                        sectionRefs.current[category]?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-shrink-0"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 메뉴 섹션 */}
            {(['할인', ...viewmodel.menuCategories, '기타'] as const).map((category, i, arr) => (
              <React.Fragment key={category}>
                <div id={category} ref={(el) => { sectionRefs.current[category] = el; }} className="pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
                  <div className="space-y-3">
                    {categorizedMenus[category]?.length ? (
                      categorizedMenus[category].map((item) => {
                        const quantity = getCartQuantity(item.id);
                        return (
                          <Card key={item.id} className="border-gray-100">
                            <CardContent className="p-4 flex items-center">
                              <div className="w-20 h-20 flex-shrink-0 mr-4">
                                <img
                                  src={item.thumbnail || '/no-image.jpg'}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{item.name}</h4>
                                {item.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {item.discountRate !== 0 ? (
                                    <span className="text-sm text-gray-400 line-through">
                                      {item.originalPrice.toLocaleString()}원
                                    </span>
                                  ) : null}
                                  <span className="text-lg font-bold text-teal-600">
                                    {item.discountPrice.toLocaleString()}원
                                  </span>
                                  {item.discountRate !== 0 ? (
                                    <Badge className="bg-semantic-discount-500 text-white text-xs">
                                      {item.discountRate}% 할인
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {quantity > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-8 h-8 p-0 bg-transparent"
                                      onClick={() => handleRemoveFromCart(item.id)}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-8 h-8 p-0 bg-transparent"
                                      onClick={() => handleAddToCart(item)}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddToCart(item)}
                                    className="bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    담기
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">이 카테고리에 메뉴가 없습니다.</p>
                    )}
                  </div>
                </div>
                {i < arr.length - 1 && <div className="border-b-2 border-gray-200 my-4" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">가게 정보</h3>
            <Card className="border-teal-100">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">주소</h3>
                  <p className="text-gray-600">{viewmodel.address}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">전화번호</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{viewmodel.phone}</p>
                    <Button asChild variant="outline" size="sm">
                      <a href={`tel:${viewmodel.phone.replace(/\D/g, '')}`}>
                        <Phone className="w-4 h-4 mr-1" />
                        전화
                      </a>
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">카테고리</h3>
                  <p className="text-gray-600">{viewmodel.category}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Reservation Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-teal-100 p-4 shadow-lg max-w-xl mx-auto">
        {appState.cart && appState.cart.items.length > 0 ? (
          <div className="space-y-3">
            {/* 선택한 증정 수량 표기 */}
            {(() => {
              const count = giftSections.reduce(
                (acc, s) => acc + (getSelectedMenuId(viewmodel.id, s.id) ? 1 : 0),
                0
              );
              return count > 0 ? (
                <div className="text-sm text-teal-700">증정 선택 {count}건</div>
              ) : null;
            })()}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">선택한 메뉴 {totalItems}개</span>
              <span className="font-bold text-lg text-teal-600">{totalPrice.toLocaleString()}원</span>
            </div>
            <Button
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 text-lg font-semibold"
              onClick={handleReservation}
            >
              {totalPrice.toLocaleString()}원 쿠폰 발급받기
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-3">메뉴를 선택해주세요</p>
            <Button disabled className="w-full bg-gray-300 text-gray-500 py-4 text-lg font-semibold cursor-not-allowed">
              메뉴 선택 후 쿠폰 발급 가능
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}