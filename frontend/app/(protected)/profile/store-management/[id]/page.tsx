"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Loader2, ChevronRight, ShoppingBag, Percent } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { StoreEntity } from "@/lib/entities/store.entity"

export default function StoreManagementPage({ params }: { params: { id: string } }) {
  const storeId = params.id

  const [storeData, setStoreData] = useState<StoreEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStore() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/stores/${storeId}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('가게 정보를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setStoreData(data)
      } catch (err: any) {
        console.error("Unexpected error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (storeId) {
      fetchStore()
    }
  }, [storeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">가게 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <Link href="/profile">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">마이페이지로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!storeData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">가게를 찾을 수 없습니다.</h1>
          <Link href="/profile">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">마이페이지로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-teal-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800">{storeData.name} 관리</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        <Link href={`/profile/store-management/${storeId}/menu`}>
          <Card className="border-teal-100 hover:shadow-md transition-shadow">
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

        <Link href={`/profile/store-management/${storeId}/discount`}>
          <Card className="border-orange-100 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Percent className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="font-medium text-gray-800">할인 관리</span>
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