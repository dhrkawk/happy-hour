// app/profile/store-select/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetMyStores } from "@/hooks/usecases/stores.usecase";

export default function StoreSelectPage() {
  const router = useRouter();
  const { data: stores, isLoading, error } = useGetMyStores();

  const sortedStores = useMemo(() => {
    if (!stores) return [];
    return [...stores].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [stores]);

  const handleSelect = (id: string) => {
    router.push(`/profile/store-management/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-700">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>가게 목록을 불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600">
        가게 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        <Link href="/profile" className="mt-4">
          <Button variant="outline">마이페이지로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-4 py-4 flex items-center gap-3">
          <Link href="/profile" className="rounded-md p-1 hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">가게 선택</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {sortedStores.length === 0 ? (
          <Card className="border-blue-100">
            <CardContent className="p-6 text-center">
              <p className="text-gray-700 mb-4">등록된 가게가 없습니다.</p>
              <Link href="/profile/store-registration">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  내 가게 등록하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleSelect(store.id)}
                className="w-full text-left"
              >
                <Card className="border-gray-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {store.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            클릭하면 관리 화면으로 이동합니다
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* 보조 액션 */}
        {sortedStores.length > 0 && (
          <div className="pt-2">
            <Link href="/profile/store-registration">
              <Button variant="outline" className="w-full">
                다른 가게 추가 등록
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
