"use client"

import { ArrowLeft, Settings, LogOut, ChevronRight, ShoppingBag, MessageCircle, Store } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation" // ✅ 추가
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import BottomNavigation from "@/components/bottom-navigation"
import { createClient } from "@/infra/supabase/shared/client"
import { useGetUserProfile } from "@/hooks/usecases/profile.usecase"
import { Loader2 } from "lucide-react"
import { useGetMyStoreId } from "@/hooks/usecases/stores.usecase"

export default function ProfilePage() {
  const router = useRouter() // ✅ 추가

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const { data: me, isLoading: meLoading, error: meError } = useGetUserProfile();
  const { data: storeIds, isLoading: storeIdLoading, error: storeIdError } = useGetMyStoreId();

  if (meLoading || storeIdLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-blue-700">정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (meError || storeIdError) {
    return <div>다시 시도해주세요.</div>
  }

  if (!me) {
    return (
      <div className="p-6 text-center">
        사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.
      </div>
    )
  }

  const isStoreOwnerOrAdmin = me.role === 'store_owner' || me.role === 'admin'
  const count = storeIds?.length ?? 0
  const primaryStoreId = storeIds?.[0]

  // ✅ 가게 관리 카드 클릭 시 분기 이동
  const handleStoreManageClick = () => {
    if (count === 0) {
      router.push("/profile/store-registration")
    } else if (count === 1 && primaryStoreId) {
      router.push("/profile/store-selection")
    } else {
      router.push("/profile/store-selection")
    }
  }

  // 라벨도 상황에 맞게 표시
  const storeManageLabel =
    count === 0 ? "나의 가게 등록하기" : count === 1 ? "가게 관리" : "가게 선택 후 관리"

  const storeManageIconColor =
    count === 0 ? "text-blue-600" : count === 1 ? "text-green-600" : "text-emerald-600"

  const storeManageBgColor =
    count === 0 ? "bg-blue-100" : count === 1 ? "bg-green-100" : "bg-emerald-100"

  return (
    <div className="min-h-screen bg-gray-50 max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-800">마이페이지</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 pb-24">
        {/* 프로필 정보 */}
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-blue-500 text-white text-xl">{me.name}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800">{me.name}</h2>
                <p className="text-gray-600">{me.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이용 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{me.totalBookings}</div>
              <div className="text-sm text-gray-600">쿠폰 사용 횟수</div>
            </CardContent>
          </Card>
          <Card className="border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{me.totalSavingsText}</div>
              <div className="text-sm text-gray-600">총 절약 금액</div>
            </CardContent>
          </Card>
        </div>

        {/* 메뉴 리스트 */}
        <div className="space-y-4">
          <Link href="/coupon-box">
            <Card className="border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="font-medium text-gray-800">내 쿠폰함</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfTTfAocL37kA5gMaWD-DhltIz4P2zT3t8xYIB8UsLGJQtuBA/viewform?usp=dialog" target="_blank" rel="noopener noreferrer">
            <Card className="border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-medium text-gray-800">고객 지원</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* ✅ 가게 관리 카드: 클릭 시 분기 이동 */}
          {isStoreOwnerOrAdmin && (
            <Card
              className="border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={handleStoreManageClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${storeManageBgColor} rounded-lg flex items-center justify-center`}>
                      <Store className={`w-5 h-5 ${storeManageIconColor}`} />
                    </div>
                    <span className="font-medium text-gray-800">{storeManageLabel}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className="border-red-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleLogout}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-medium text-red-600">로그아웃</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  )
}