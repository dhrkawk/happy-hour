"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Clock, Map } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"
import { storesData } from "@/lib/store-data"

// 홈페이지용 가게 리스트 (거리순으로 정렬)
const allStores = Object.values(storesData)
  .map((store) => ({
    ...store,
    image: store.thumbnail, // 썸네일 이미지 사용
  }))
  .sort((a, b) => a.distance - b.distance) // 거리순으로 정렬

export default function HomePage() {
  const [location, setLocation] = useState("현재 위치를 가져오는 중...")
  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [filteredStores, setFilteredStores] = useState(allStores)
  const router = useRouter()

  useEffect(() => {
    // 로그인 상태 체크 (실제로는 토큰이나 세션을 확인)
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"

    if (!isLoggedIn) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    // 위치 정보 요청 시뮬레이션
    setTimeout(() => {
      setLocation("서울시 강남구 역삼동")
    }, 1000)
  }, [])

  // 카테고리 필터링
  useEffect(() => {
    if (selectedCategory === "전체") {
      setFilteredStores(allStores)
    } else {
      setFilteredStores(allStores.filter((store) => store.category === selectedCategory))
    }
  }, [selectedCategory])

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-teal-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-teal-600">해피아워</h1>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            </div>
            <Link href="/map">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                <Map className="w-4 h-4 mr-1" />
                지도
              </Button>
            </Link>
          </div>

          {/* 카테고리 필터 */}
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>
      </header>

      {/* 가게 리스트 */}
      <div className="px-4 py-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "지금 할인 중인 가게" : `${selectedCategory} 할인 가게`} (
            {filteredStores.length})
          </h2>
          <Badge variant="secondary" className="bg-teal-100 text-teal-700">
            거리순
          </Badge>
        </div>

        {filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">해당 카테고리의 할인 가게가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택해보세요!</p>
            <Button onClick={() => setSelectedCategory("전체")} className="bg-teal-500 hover:bg-teal-600 text-white">
              전체 가게 보기
            </Button>
          </div>
        ) : (
          filteredStores.map((store) => (
            <Link key={store.id} href={`/store/${store.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow border-teal-100">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-20 h-20 bg-gray-200 flex-shrink-0">
                      <img
                        src={store.image || "/placeholder.svg"}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm">{store.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {store.distance}km
                            </div>
                            <span className="text-xs text-gray-400">{store.category}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                              {store.discount}% 할인
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {store.timeLeft} 남음
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 line-through">
                            {store.originalPrice.toLocaleString()}원
                          </div>
                          <div className="text-sm font-bold text-teal-600">
                            {store.discountPrice.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  )
}
