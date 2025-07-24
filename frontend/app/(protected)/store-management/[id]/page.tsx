"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface SelectedMenuItem {
  id: string;
  rate: number;
}

export default function StoreManagementPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const storeId = React.use(params).id

  const [storeData, setStoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMenus, setSelectedMenus] = useState<SelectedMenuItem[]>([])
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

  useEffect(() => {
    async function fetchStore() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from("stores")
          .select("*, store_menus(*)") // Fetch store_menus
          .eq("id", storeId)
          .single()

        if (error) {
          console.error("Error fetching store:", error)
          setError("가게 정보를 불러오는 데 실패했습니다.")
          setLoading(false)
          return
        }

        if (!data) {
          notFound()
        }
        setStoreData(data)
      } catch (err) {
        console.error("Unexpected error:", err)
        setError("알 수 없는 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    if (storeId) {
      fetchStore()
    }
  }, [storeId, supabase])

  const handleMenuSelect = (menuId: string, isChecked: boolean) => {
    setSelectedMenus((prevSelected) => {
      if (isChecked) {
        // Add menu with a default rate if not already present
        if (!prevSelected.some(menu => menu.id === menuId)) {
          return [...prevSelected, { id: menuId, rate: 0 }];
        }
      } else {
        // Remove menu
        return prevSelected.filter((menu) => menu.id !== menuId);
      }
      return prevSelected; // No change if already present and checked, or not present and unchecked
    });
  };

  const handleRateChange = (menuId: string, rate: number) => {
    setSelectedMenus((prevSelected) =>
      prevSelected.map((menu) => (menu.id === menuId ? { ...menu, rate } : menu))
    );
  };

  const handleApplyDiscount = async () => {
    if (selectedMenus.length === 0) {
      alert("할인 적용할 메뉴를 선택해주세요.")
      return
    }

    for (const menu of selectedMenus) {
      if (menu.rate <= 0 || menu.rate > 100) {
        alert(`메뉴 '${storeData.store_menus.find((m: any) => m.id === menu.id)?.name}'의 할인율은 1에서 100 사이의 값이어야 합니다.`);
        return;
      }
    }

    if (!startTime || !endTime) {
      alert("할인 기간을 설정해주세요.")
      return
    }
    if (new Date(startTime) >= new Date(endTime)) {
      alert("할인 종료 시간은 시작 시간보다 늦어야 합니다.")
      return
    }

    setIsApplyingDiscount(true)
    try {
      const discountsToInsert = selectedMenus.map((menu) => ({
        store_id: storeId,
        menu_id: menu.id,
        discount_rate: menu.rate,
        start_time: startTime,
        end_time: endTime,
        quantity: 9999, // Default quantity, adjust as needed
      }))

      const { error } = await supabase.from("discounts").insert(discountsToInsert)

      if (error) {
        console.error("Error applying discount:", error)
        alert("할인 적용에 실패했습니다: " + error.message)
      } else {
        alert("할인이 성공적으로 적용되었습니다!")
        // Optionally, clear selections or refresh data
        setSelectedMenus([])
        setStartTime("")
        setEndTime("")
      }
    } catch (err) {
      console.error("Unexpected error applying discount:", err)
      alert("할인 적용 중 알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsApplyingDiscount(false)
    }
  }

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

      <div className="px-4 py-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800">할인 메뉴 설정</h2>

        {/* 메뉴 선택 및 개별 할인율 */}
        <Card className="border-teal-100">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-medium text-gray-800">할인 적용 메뉴 선택 및 할인율 설정</h3>
            {(storeData.store_menus && storeData.store_menus.length > 0) ? (
              storeData.store_menus.map((menu: any) => (
                <div key={menu.id} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`menu-${menu.id}`}
                      checked={selectedMenus.some(m => m.id === menu.id)}
                      onCheckedChange={(checked: boolean) => handleMenuSelect(menu.id, checked)}
                    />
                    <Label htmlFor={`menu-${menu.id}`} className="text-sm font-medium">
                      {menu.name} ({menu.price.toLocaleString()}원)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Input
                      type="number"
                      placeholder="%"
                      value={selectedMenus.find(m => m.id === menu.id)?.rate || ""}
                      onChange={(e) => handleRateChange(menu.id, Number(e.target.value))}
                      min="1"
                      max="100"
                      className="w-20 text-right"
                      disabled={!selectedMenus.some(m => m.id === menu.id)} // Disable if not selected
                    />
                    <span>%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">등록된 메뉴가 없습니다. 메뉴를 먼저 추가해주세요.</p>
            )}
          </CardContent>
        </Card>

        {/* 할인 기간 설정 */}
        <Card className="border-teal-100">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium text-gray-800 mb-2">할인 기간 설정</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="startTime" className="mb-1 block">시작 시간</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="mb-1 block">종료 시간</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 할인 적용 버튼 */}
        <Button
          onClick={handleApplyDiscount}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-lg font-semibold"
          disabled={isApplyingDiscount || selectedMenus.length === 0 || !startTime || !endTime}
        >
          {isApplyingDiscount ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 할인 적용 중...</>
          ) : (
            "할인 적용하기"
          )}
        </Button>
      </div>
    </div>
  )
}