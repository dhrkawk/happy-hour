"use client"

import { useState, useEffect } from "react"
import { MapPin, Clock, Map } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"

import { createClient } from "@/lib/supabase/client"

interface StoreData {
  id: string
  name: string
  category: string
  address: string
  thumbnail: string
  distance: number
  discount: number
  originalPrice: number
  discountPrice: number
  timeLeft: string
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [location, setLocation] = useState("현재 위치를 가져오는 중...")
  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [allStores, setAllStores] = useState<StoreData[]>([])
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      const cached = localStorage.getItem('onboardingChecked')
      if (cached === 'true') {
        setOnboardingChecked(true)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile) {
        router.push('/onboarding')
      } else {
        localStorage.setItem('onboardingChecked', 'true')
        setOnboardingChecked(true)
      }
    }

    checkOnboarding()
  }, [router, supabase])

  // ✅ 온보딩 체크 후 스토어 불러오기 + 위치 설정
  useEffect(() => {
    if (!onboardingChecked) return

    const fetchStores = async () => {
      setLoadingStores(true)
      const { data, error } = await supabase
        .from("stores")
        .select("*, discounts(*, store_menus(*))")

      if (error) {
        console.error("Error fetching stores from DB:", error)
        setAllStores([])
      } else {
        const transformedStores: StoreData[] = (data || []).map((store: any) => {
          const discount = store.discounts?.[0] || null
          const originalPrice = discount?.original_price || 0
          const discountRate = discount?.discount_rate || 0
          const discountPrice = originalPrice * (1 - discountRate / 100)

          return {
            id: store.id,
            name: store.name,
            category: store.category,
            address: store.address,
            thumbnail: discount?.store_menus?.thumbnail || "/placeholder.svg",
            distance: 0.5, // 나중에 실제 계산으로 수정 가능
            discount: discountRate,
            originalPrice: originalPrice,
            discountPrice: discountPrice,
            timeLeft: "2시간",
          }
        }).sort((a, b) => a.distance - b.distance)

        setAllStores(transformedStores)
      }

      setLoadingStores(false)
    }

    fetchStores()

    // ✅ 위치 정보 요청
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            )
            const data = await response.json()
            const address = data.address
            const locationString = `${address.city || ""} ${address.road || address.suburb || address.neighbourhood || ""}`.trim()
            setLocation(locationString || "위치를 찾을 수 없습니다.")
          } catch (error) {
            console.error("Error fetching address: ", error)
            setLocation("주소를 가져오는 데 실패했습니다.")
          }
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocation("위치 정보 제공에 동의해주세요.")
              break
            case error.POSITION_UNAVAILABLE:
              setLocation("현재 위치를 가져올 수 없습니다.")
              break
            case error.TIMEOUT:
              setLocation("위치 정보를 가져오는 데 시간이 초과되었습니다.")
              break
            default:
              setLocation("알 수 없는 오류가 발생했습니다.")
              break
          }
        }
      )
    } else {
      setLocation("이 브라우저에서는 위치 정보를 지원하지 않습니다.")
    }
  }, [onboardingChecked])

  // ✅ 카테고리 필터링
  useEffect(() => {
    if (!onboardingChecked) return

    if (selectedCategory === "전체") {
      setFilteredStores(allStores)
    } else {
      setFilteredStores(allStores.filter((store) => store.category === selectedCategory))
    }
  }, [selectedCategory, allStores, onboardingChecked])

  if (!onboardingChecked || loadingStores) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col items-center justify-center p-4">
        <p>가게 정보를 불러오는 중...</p>
      </div>
    )
  }
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

          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>
      </header>

      {/* 가게 리스트 */}
      <div className="px-4 py-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "지금 할인 중인 가게" : `${selectedCategory} 할인 가게`} ({filteredStores.length})
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
                        src={store.thumbnail || "/placeholder.svg"}
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