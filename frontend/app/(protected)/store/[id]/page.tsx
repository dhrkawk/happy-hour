"use client"
import React, { useState, useEffect, useRef } from "react"
import { ArrowLeft, MapPin, Clock, Heart, Share2, Phone, Plus, Minus, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/contexts/app-context"
import { createCartItem } from "@/lib/viewmodels/cart-item.viewmodel";
import { StoreDetailViewModel, StoreMenuViewModel } from "@/lib/viewmodels/store-detail.viewmodel";
import { StoreApiClient } from "@/lib/services/stores/store.api-client";
import { useGiftContext } from "@/contexts/gift-context"; // ★ 추가
import { useGetStoreById } from "@/hooks/use-get-store-by-id"; // New import
import { weekdayLabelMap } from "@/lib/utils";

export default function StorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const { appState, addToCart, updateItemQuantity, removeFromCart, getCartTotals, clearCart } = useAppContext();
  const { location, cart } = appState;
  const { coordinates } = location;

  // Use the new hook for store data
  const { store: viewmodel, isLoading, error } = useGetStoreById(storeId, coordinates);

  const [activeTab, setActiveTab] = useState("menu");
  const [isLiked, setIsLiked] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string | null>(null);
  const [categorizedMenus, setCategorizedMenus] = useState<Record<string, StoreMenuViewModel[]>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ★ GiftContext 훅
  const {
    selectGift,
    unselectGift,
    getSelectedMenuId,
    clearStoreGifts,
    activeGiftStoreId, // Get activeGiftStoreId from context
  } = useGiftContext();

  // =========================
  // 증정 섹션 VM
  // =========================
  type GiftSectionVM = {
    id: string;
    displayNote: string | null;
    endAt: string;
    remaining: number | null;
    menus: StoreMenuViewModel[]; // 0원 표시로 가공된 메뉴
  };

  const [giftSections, setGiftSections] = useState<GiftSectionVM[]>([]);

  // Intersection Observer for sticky tabs
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setSelectedMenuCategory(entry.target.id)),
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
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
  }, [categorizedMenus]);

  // This useEffect will now depend on 'viewmodel' from the hook
  useEffect(() => {
    if (!viewmodel) return; // Ensure viewmodel is loaded

    // 장바구니가 존재하고, 현재 가게 ID와 다를 경우에만 장바구니 비우기
    if (cart && cart.storeId !== storeId) {
      clearCart();
    }

    // 증정품: activeGiftStoreId가 존재하고 현재 storeId와 다를 경우 이전 가게의 증정품 비우기
    if (activeGiftStoreId && activeGiftStoreId !== storeId) {
      clearStoreGifts(activeGiftStoreId);
    }

    // Group menus by category
    const grouped: Record<string, StoreMenuViewModel[]> = {};
    const allCategories = ["할인", ...(viewmodel.menu_category || []), "기타"];
    allCategories.forEach(cat => { grouped[cat] = []; });

    (viewmodel.menu || []).forEach(menu => {
      if (menu.discountRate > 0) grouped["할인"].push(menu);
      if (menu.category && grouped[menu.category]) grouped[menu.category].push(menu);
      else if (menu.discountRate === 0) grouped["기타"].push(menu);
    });
    setCategorizedMenus(grouped);

    // 증정 메뉴를 100% 할인(0원)으로 표시하도록 가공
    const asGiftMenu = (m: StoreMenuViewModel, gId: string, gEnd: string): StoreMenuViewModel => ({
      ...m,
      discountRate: 100,
      discountPrice: 0,
      discountDisplayText: "증정",
      thumbnail: m.thumbnail || "no-image.jpg",
    });

    const sections: GiftSectionVM[] = (viewmodel.gifts ?? [])
      .map(g => {
        const gm = (g.menus ?? []).map(m => asGiftMenu(m, g.id, g.endAt));
        return {
          id: g.id,
          displayNote: g.displayNote ?? null,
          endAt: g.endAt,
          remaining: g.remaining,
          menus: gm,
        };
      })
      .filter(s => s.menus.length > 0);

    setGiftSections(sections);

    setSelectedMenuCategory("할인");
  }, [viewmodel, storeId, cart, clearCart, activeGiftStoreId, clearStoreGifts]);

  // 체크박스 토글: giftId 당 1개 선택
  const onToggleGiftCheckbox = (giftId: string, menu: StoreMenuViewModel, checked: boolean, meta: { displayNote?: string|null, endAt?: string|null, remaining?: number|null }) => {
    if (checked) {
      selectGift({
        storeId,
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
      unselectGift(storeId, giftId);
    }
  };

  const calcTimeLeft = (endISO: string) => {
    const diff = new Date(endISO).getTime() - Date.now();
    if (diff <= 0) return "마감";
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (d > 0) return `${d}일 남음`;
    if (h > 0) return `${h}시간 남음`;
    const m = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${m}분 남음`;
  };

  // 메뉴 카트 관련 (기존 그대로)
  const handleAddToCart = (menu: StoreMenuViewModel) => {
    if (!viewmodel) return;
    const cartItem = createCartItem(menu);
    addToCart({ id: viewmodel.id, name: viewmodel.name }, cartItem);
  };

  const handleRemoveFromCart = (menuId: string) => {
    const currentQuantity = getCartQuantity(menuId);
    if (currentQuantity > 1) updateItemQuantity(menuId, currentQuantity - 1);
    else removeFromCart(menuId);
  };

  const getCartQuantity = (menuId: string) => {
    return cart?.items.find(item => item.menuId === menuId)?.quantity ?? 0;
  };

  const { totalItems, totalPrice } = getCartTotals();

  // 예약 버튼: gift 선택을 쿼리로 전달
  const handleReservation = () => {
    if (!cart || cart.items.length === 0) return;
    router.push(`/reservation/${cart.storeId}`);
  };

  if (!viewmodel) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">가게 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error || !viewmodel) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">가게를 찾을 수 없습니다</h1>
          <Link href="/">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
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
                <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Store Thumbnail */}
      <div className="relative">
        <div className="h-64 bg-gray-200">
          <img
            src={viewmodel.storeThumbnail || "/no-image.jpg"}
            alt={viewmodel.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Store Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{viewmodel.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{viewmodel.distance}</span>
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
            {viewmodel.events && viewmodel.events.length > 0 ? (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-blue-500 text-xl">📣</div>
                  <div className="text-blue-900 font-semibold text-sm">이 매장의 진행 중인 이벤트</div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  {viewmodel.events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white border border-blue-100 rounded-lg p-3 shadow-sm"
                    >
                      <div className="font-semibold text-blue-800 text-sm">{event.title}</div>

                      {event.description && (
                        <div className="text-xs text-blue-700 mt-1">{event.description}</div>
                      )}

                      <div className="text-xs text-blue-700 mt-2">
                        기간: {new Date(event.start_date).toLocaleDateString()} ~ {new Date(event.end_date).toLocaleDateString()}
                      </div>

                      {event.happyhour_start_time && event.happyhour_end_time && (
                        <div className="text-xs text-blue-700">
                          시간: {event.happyhour_start_time} ~ {event.happyhour_end_time}
                        </div>
                      )}

                      <div className="text-xs text-blue-700">
                        요일: {event.weekdays.map((day) => weekdayLabelMap[day] || day).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{viewmodel.description}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "menu" ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            🍽️ 메뉴
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "info" ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📍 정보
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 pb-32">
        {activeTab === "menu" && (
          <div className="space-y-3">

            {/* Sticky Category Tabs */}
            {viewmodel?.menu_category && viewmodel.menu_category.length > 0 && (
              <div className="sticky top-0 bg-white z-10 py-2 border-b border-gray-100 -mx-4 px-4">
                <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
                  <Button
                    variant={selectedMenuCategory === "할인" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedMenuCategory("할인");
                      sectionRefs.current["할인"]?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-shrink-0"
                  >
                    할인
                  </Button>
                  {viewmodel.menu_category.map((category) => (
                    <Button
                      key={category}
                      variant={selectedMenuCategory === category ? "default" : "outline"}
                      onClick={() => {
                        setSelectedMenuCategory(category);
                        sectionRefs.current[category]?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex-shrink-0"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* =========================
                증정 섹션 (체크박스 선택, 카트 미사용)
               ========================= */}
            {giftSections.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">증정</h3>
                <div className="space-y-3">
                  {giftSections.map(section => {
                    const timeLeft = calcTimeLeft(section.endAt);
                    return (
                      <Card key={section.id} className="border-gray-100">
                        <CardContent className="p-4">
                          {/* 증정 헤더 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-semantic-gift-500 text-white text-xs">증정</Badge>
                              {section.displayNote && <span className="text-sm text-gray-700">{section.displayNote}</span>}
                              <span className="text-xs text-gray-500">(한 개 선택)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              {section.remaining != null && <span className="text-gray-600">남은 수량 {section.remaining}</span>}
                              <span className="text-red-500 font-medium">{timeLeft}</span>
                            </div>
                          </div>

                          {/* 체크박스 리스트 */}
                          <div className="space-y-2">
                            {section.menus.map(m => {
                              const checked = getSelectedMenuId(storeId, section.id) === m.id;
                              return (
                                <label
                                  key={m.id}
                                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition
                                    ${checked ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
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
                                      src={m.thumbnail || "/no-image.jpg"}
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
                <div className="border-b-2 border-gray-200 my-4"></div>
              </div>
            )}

            {/* Menu Sections */}
            {Object.keys(categorizedMenus).map((category, index) => (
              <React.Fragment key={category}>
                <div id={category} ref={(el) => { sectionRefs.current[category] = el; }} className="pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
                  <div className="space-y-3">
                    {categorizedMenus[category].length > 0 ? (
                      categorizedMenus[category].map((item) => {
                        console.log("Rendering item:", item); // Debugging log
                        const quantity = getCartQuantity(item.id);
                        return (
                          <Card key={item.id} className="border-gray-100">
                            <CardContent className="p-4 flex items-center">
                              <div className="w-20 h-20 flex-shrink-0 mr-4">
                                <img
                                  src={item.thumbnail || "/no-image.jpg"}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{item.name}</h4>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  {item.discountRate != 0 ? (
                                    <span className="text-sm text-gray-400 line-through">
                                      {item.originalPrice.toLocaleString()}원
                                    </span>
                                  ) : null}
                                  <span className="text-lg font-bold text-teal-600">
                                    {item.discountPrice.toLocaleString()}원
                                  </span>
                                  {item.discountRate != 0 ? (
                                    <Badge className="bg-semantic-discount-500 text-white text-xs">{item.discountRate}% 할인</Badge>
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
                {index < Object.keys(categorizedMenus).length - 1 && (
                  <div className="border-b-2 border-gray-200 my-4"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {activeTab === "info" && (
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
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      전화
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
        {cart && cart.items.length > 0 ? (
          <div className="space-y-3">
            {/* 선택한 증정 개수(합계 미반영) */}
            {(() => {
              // storeId에 대한 현재 선택 개수 계산
              // getSelectedMenuId를 giftSections 순회해서 세면 간단
              const count = giftSections.reduce((acc, s) => acc + (getSelectedMenuId(storeId, s.id) ? 1 : 0), 0);
              return count > 0 ? (
                <div className="text-sm text-teal-700">증정 선택 {count}건</div>
              ) : null;
            })()}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">선택한 메뉴 {totalItems}개</span>
              <span className="font-bold text-lg text-teal-600">{totalPrice.toLocaleString()}원</span>
            </div>
            <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 text-lg font-semibold" onClick={handleReservation}>
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
  )
}