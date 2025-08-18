"use client"

import { ArrowLeft, Settings, LogOut, ChevronRight, ShoppingBag, MessageCircle, Store } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import BottomNavigation from "@/components/bottom-navigation"
import { useUser } from  "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"

export default function ProfilePage() {
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <div className="p-6 text-center">로딩 중...</div>
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.
      </div>
    )
  }

  const userData = {
    name: user.user_metadata?.name || user.email,
    email: user.email,
    totalBookings: user.profile?.total_bookings || 0,
    totalSavings: user.profile?.total_savings || 0,
    role: user.profile?.role || 'customer',
  }

  const isStoreOwnerOrAdmin = userData.role === 'store_owner' || userData.role === 'admin'
  const storeManagementLink = user.storeData?.id ? `/profile/store-management/${user.storeData.id}` : '#'

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/home">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
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
                <AvatarFallback className="bg-teal-500 text-white text-xl">{userData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800">{userData.name}</h2>
                <p className="text-gray-600">{userData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이용 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-teal-600 mb-1">{userData.totalBookings}</div>
              <div className="text-sm text-gray-600">총 예약 횟수</div>
            </CardContent>
          </Card>
          <Card className="border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500 mb-1">{userData.totalSavings.toLocaleString()}원</div>
              <div className="text-sm text-gray-600">총 절약 금액</div>
            </CardContent>
          </Card>
        </div>

        {/* 메뉴 리스트 */}
        <div className="space-y-4">
          <Link href="/bookings">
            <Card className="border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="font-medium text-gray-800">예약 현황</span>
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

          {isStoreOwnerOrAdmin && (
            user.storeData?.id ? (
              <Link href={storeManagementLink}>
                <Card className="border-gray-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-800">가게 관리</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Link href="/profile/store-registration">
                <Card className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-800">나의 가게 등록하기</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
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