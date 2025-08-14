"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddressSearchMap from "@/components/map/address-search-map";
import { useCreateStore } from "@/hooks/use-create-store";

export default function StoreRegistrationPage() {
  const {
    form,
    loading,
    error,
    handleChange,
    handleAddressSelect,
    handleStoreThumbnailChange,
    handleSubmit,
    storeThumbnail,
  } = useCreateStore();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-teal-600">나의 가게 등록하기</CardTitle>
            <CardDescription className="text-center text-gray-500">가게 정보를 입력해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">가게명</Label>
                  <Input id="name" name="name" placeholder="예: 행복한 베이커리" value={form.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Input id="category" name="category" placeholder="예: 베이커리" value={form.category} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <AddressSearchMap onAddressSelect={handleAddressSelect} />
                <Input id="address" name="address" placeholder="지도에서 주소를 검색하거나 클릭하세요." value={form.address} onChange={handleChange} required readOnly />
                <input type="hidden" name="lat" value={form.lat} />
                <input type="hidden" name="lng" value={form.lng} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_thumbnail">가게 이미지</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="store_thumbnail"
                    name="store_thumbnail"
                    type="file"
                    onChange={handleStoreThumbnailChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('store_thumbnail')?.click()}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    파일 선택
                  </Button>
                  {storeThumbnail && <span className="text-sm text-gray-600">{storeThumbnail.name}</span>}
                </div>
              </div>
              {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    등록 중...
                  </div>
                ) : (
                  "등록 완료"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
