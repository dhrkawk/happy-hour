"use client"
import { ArrowLeft, Loader2, ChevronRight, ShoppingBag, Percent, Calendar, Gift, Store } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { useParams } from "next/navigation";

export default function StoreManagementPage() {
  const params = useParams();
  const storeId = params.id as string;

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800">가게 관리</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        <Link href={`/profile/store-management/${storeId}/store`}>
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-medium text-gray-800">가게 정보 관리</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/profile/store-management/${storeId}/menus`}>
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="font-medium text-gray-800">메뉴 관리</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/profile/store-management/${storeId}/coupons`}>
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="font-medium text-gray-800">쿠폰 관리</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/profile/store-management/${storeId}/event`}>
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Percent className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="font-medium text-gray-800">할인 이벤트 관리</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}