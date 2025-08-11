"use client"
import React, { useState, useEffect, useRef } from "react"
import { ArrowLeft, MapPin, Clock, Heart, Share2, Phone, Plus, Minus, ShoppingCart, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/contexts/app-context"
import { createCartItem } from "@/lib/viewmodels/cart-item.viewmodel";
import { StoreDetailViewModel, createStoreDetailViewModel, StoreMenuViewModel } from "@/lib/viewmodels/store-detail.viewmodel";
import { StoreApiClient } from "@/lib/services/stores/store.api-client";

export default function StorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const storeApiClient = new StoreApiClient();

  const { appState, addToCart, updateItemQuantity, removeFromCart, getCartTotals } = useAppContext();
  const { location, cart } = appState;
  const { coordinates } = location;
  const [viewmodel, setViewModel] = useState<StoreDetailViewModel>();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [isLiked, setIsLiked] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string | null>(null);
  const [categorizedMenus, setCategorizedMenus] = useState<Record<string, StoreMenuViewModel[]>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 상단 state들 아래
  type GiftSectionVM = {
    id: string;
    displayNote: string | null;
    endAt: string;
    remaining: number | null;
    menus: StoreMenuViewModel[];     // 이 gift에 속한 메뉴(0원으로 표시)
  };

  const [giftSections, setGiftSections] = useState<GiftSectionVM[]>([]);
  const [giftSelections, setGiftSelections] = useState<Record<string, string>>({}); // giftId -> selected menuId

  // Intersection Observer for sticky tabs
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSelectedMenuCategory(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px", // Adjust this to control when intersection occurs
        threshold: 0,
      }
    );

    // Observe all category sections
    Object.keys(categorizedMenus).forEach((category) => {
      const ref = sectionRefs.current[category];
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      // Disconnect observer on component unmount
      Object.keys(categorizedMenus).forEach((category) => {
        const ref = sectionRefs.current[category];
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, [categorizedMenus]); // Re-run when categorizedMenus changes

  useEffect(() => {
    if (coordinates) {
      const fetchStoreDetail = async () => {
        try {
          const storeDetail: StoreDetailViewModel = await storeApiClient.getStoreById(storeId, coordinates);

          // Group menus by category
          const grouped: Record<string, StoreMenuViewModel[]> = {};
          const allCategories = ["할인", ...(storeDetail.menu_category || []), "기타"];

          allCategories.forEach(cat => {
            grouped[cat] = [];
          });

          (storeDetail.menu || []).forEach(menu => {
            if (menu.discountRate > 0) {
              grouped["할인"].push(menu);
            }
            if (menu.category && grouped[menu.category]) {
              grouped[menu.category].push(menu);
            } else if (menu.discountRate === 0) { // Only add to 기타 if not discounted and no specific category
              grouped["기타"].push(menu);
            }
          });

          setCategorizedMenus(grouped);
          const asGiftMenu = (m: StoreMenuViewModel, gId: string, gEnd: string): StoreMenuViewModel => ({
            ...m,
            discountRate: 100,
            discountPrice: 0,
            discountDisplayText: "증정",
            discountId: `gift-${gId}`,               // 일반 할인과 구분
            discountEndTime: gEnd || m.discountEndTime,
            thumbnail: m.thumbnail || "no-image.jpg",
          });

          const sections: GiftSectionVM[] = (storeDetail.gifts ?? []).map(g => {
            const gm = (g.menus ?? []).map(m => asGiftMenu(m, g.id, g.endAt));
            return {
              id: g.id,
              displayNote: g.displayNote ?? null,
              endAt: g.endAt,
              remaining: g.remaining,
              menus: gm,
            };
          }).filter(s => s.menus.length > 0);

          setGiftSections(sections);

          // 기본 선택(여러 개면 첫 번째 자동 선택)
          const initial: Record<string, string> = {};
          sections.forEach(s => {
            if (s.menus.length > 1) initial[s.id] = s.menus[0].id;
          });
          setGiftSelections(initial);
          setViewModel(storeDetail);
          setSelectedMenuCategory("할인"); // Set initial active category to 할인
        } catch (err: any) {
          console.error("가게 정보를 불러오는 중 오류 발생:", err);
          setError(err.message || "가게 정보를 불러오는 데 실패했습니다.");
        }
      };
      fetchStoreDetail();
    }
  }, [coordinates])

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

const handleSelectGiftMenu = (giftId: string, menuId: string) => {
  setGiftSelections(prev => ({ ...prev, [giftId]: menuId }));
};

const handleAddSelectedGift = (giftId: string) => {
  if (!viewmodel) return;
  const section = giftSections.find(s => s.id === giftId);
  if (!section) return;

  const menus = section.menus;
  const selectedId = menus.length === 1 ? menus[0].id : giftSelections[giftId];
  const chosen = menus.find(m => m.id === selectedId);
  if (!chosen) return;

  // 100% 할인(0원)으로 이미 가공됨
  const cartItem = createCartItem(chosen);
  addToCart({ id: viewmodel.id, name: viewmodel.name }, cartItem);
};

  const handleAddToCart = (menu: StoreMenuViewModel) => {
    if (!viewmodel) return;
    const cartItem = createCartItem(menu);
    addToCart({ id: viewmodel.id, name: viewmodel.name }, cartItem);
  };

  const handleRemoveFromCart = (menuId: string) => {
    const currentQuantity = getCartQuantity(menuId);
    if (currentQuantity > 1) {
      updateItemQuantity(menuId, currentQuantity - 1);
    } else {
      removeFromCart(menuId);
    }
  };

  const getCartQuantity = (menuId: string) => {
    return cart?.items.find(item => item.menuId === menuId)?.quantity ?? 0;
  };

  const { totalItems, totalPrice } = getCartTotals();

  const handleReservation = () => {
    if (!cart || cart.items.length === 0) {
      return;
    }
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
      <header className="bg-white shadow-sm border-b border-teal-100 relative z-10">
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
            <div className="flex items-center gap-2">
              {viewmodel.discount != 0 ? <Badge className="bg-orange-500 text-white text-sm">{viewmodel.discount}% 할인</Badge>:null}
              <div className="flex items-center gap-1 text-red-500 font-medium text-sm">
                <Clock className="w-4 h-4" />
                <span>{viewmodel.timeLeft}</span>
              </div>
            </div>
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

            {/* GIFT SECTION (최상단) */}
            {/* ===== GIFT SECTION (증정별 그룹, 최상단) ===== */}
            {giftSections.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">증정</h3>
                <div className="space-y-3">
                  {giftSections.map(section => {
                    const timeLeft = calcTimeLeft(section.endAt);
                    const multiple = section.menus.length > 1;
                    const selectedId = multiple ? (giftSelections[section.id] ?? section.menus[0].id) : section.menus[0].id;

                    return (
                      <Card key={section.id} className="border-teal-200">
                        <CardContent className="p-4">
                          {/* 증정 헤더 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-teal-600 text-white text-xs">증정</Badge>
                              {section.displayNote && (
                                <span className="text-sm text-gray-700">{section.displayNote}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              {section.remaining != null && (
                                <span className="text-gray-600">남은 수량 {section.remaining}</span>
                              )}
                              <span className="text-red-500 font-medium">{timeLeft}</span>
                            </div>
                          </div>

                          {/* 증정 품목 선택(여러 개일 때) */}
                          {multiple && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {section.menus.map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => handleSelectGiftMenu(section.id, m.id)}
                                  className={`px-3 py-2 rounded-md border text-sm transition
                                    ${selectedId === m.id
                                      ? "border-teal-500 bg-teal-50 text-teal-700"
                                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                                >
                                  {m.name}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 선택된 품목 미리보기 카드(기존 카드 UI 재사용) */}
                          {(() => {
                            const m = section.menus.find(mm => mm.id === selectedId)!;
                            const quantity = getCartQuantity(m.id);

                            return (
                              <div className="flex items-center">
                                <div className="w-20 h-20 flex-shrink-0 mr-4">
                                  <img
                                    src={m.thumbnail || "/no-image.jpg"}
                                    alt={m.name}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-800">{m.name}</h4>
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{m.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-gray-400 line-through">
                                      {m.originalPrice.toLocaleString()}원
                                    </span>
                                    <span className="text-lg font-bold text-teal-600">0원</span>
                                    <Badge className="bg-teal-600 text-white text-xs">증정</Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {quantity > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-8 h-8 p-0 bg-transparent"
                                        onClick={() => handleRemoveFromCart(m.id)}
                                      >
                                        <Minus className="w-4 h-4" />
                                      </Button>
                                      <span className="w-8 text-center font-medium">{quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-8 h-8 p-0 bg-transparent"
                                        onClick={() => handleAddSelectedGift(section.id)}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddSelectedGift(section.id)}
                                      className="bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      담기
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
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
                        const quantity = getCartQuantity(item.id);
                        return (
                          <Card key={item.id} className="border-teal-100">
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
                                  {item.discountRate != 0 ? <span className="text-sm text-gray-400 line-through"> {item.originalPrice.toLocaleString()}원 </span> : null}
                                  <span className="text-lg font-bold text-teal-600">
                                    {item.discountPrice.toLocaleString()}원
                                  </span>
                                  {(item.discountRate != 0) ? <Badge className="bg-orange-500 text-white text-xs">{item.discountRate}% 할인</Badge> : null} 
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">선택한 메뉴 {totalItems}개</span>
              <span className="font-bold text-lg text-teal-600">{totalPrice.toLocaleString()}원</span>
            </div>
            <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 text-lg font-semibold" onClick={handleReservation}>
              {totalPrice.toLocaleString()}원으로 예약하기
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-3">메뉴를 선택해주세요</p>
            <Button disabled className="w-full bg-gray-300 text-gray-500 py-4 text-lg font-semibold cursor-not-allowed">
              메뉴 선택 후 예약 가능
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
