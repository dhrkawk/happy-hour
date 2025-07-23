"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import AddressSearchMap from "@/components/map/address-search-map";

export default function CreateStorePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
    lat: 0,
    lng: 0,
    menu_name: "",
    menu_price: "",
    discount_rate: "",
    start_time: "",
    end_time: "",
    quantity: "",
  });
  const [menuThumbnail, setMenuThumbnail] = useState<File | null>(null);
  const [storeThumbnail, setStoreThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    setForm({ ...form, address, lat, lng });
  };

  const handleMenuThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMenuThumbnail(e.target.files[0]);
    }
  };

  const handleStoreThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStoreThumbnail(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("address", form.address);
    formData.append("lat", form.lat.toString());
    formData.append("lng", form.lng.toString());
    formData.append("menu_name", form.menu_name);
    formData.append("menu_price", form.menu_price);
    formData.append("discount_rate", form.discount_rate);
    formData.append("start_time", form.start_time);
    formData.append("end_time", form.end_time);
    formData.append("quantity", form.quantity);
    if (menuThumbnail) {
      formData.append("menu_thumbnail", menuThumbnail);
    }
    if (storeThumbnail) {
      formData.append("store_thumbnail", storeThumbnail);
    }

    try {
      const res = await fetch("/api/stores-discounts", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "등록에 실패했습니다.");
      }
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-teal-600">가게 및 할인 등록</CardTitle>
            <CardDescription className="text-center text-gray-500">새로운 가게와 할인 정보를 등록해주세요.</CardDescription>
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
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="menu_name">메뉴명</Label>
                  <Input id="menu_name" name="menu_name" placeholder="예: 소금빵" value={form.menu_name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menu_price">메뉴 가격</Label>
                  <Input id="menu_price" name="menu_price" type="number" placeholder="예: 3500" value={form.menu_price} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu_thumbnail">메뉴 이미지</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="menu_thumbnail"
                    name="menu_thumbnail"
                    type="file"
                    onChange={handleMenuThumbnailChange}
                    className="hidden" // Hide the default file input
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('menu_thumbnail')?.click()}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    파일 선택
                  </Button>
                  {menuThumbnail && <span className="text-sm text-gray-600">{menuThumbnail.name}</span>}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="discount_rate">할인율 (%)</Label>
                  <Input id="discount_rate" name="discount_rate" type="number" placeholder="예: 30" value={form.discount_rate} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">할인 수량</Label>
                  <Input id="quantity" name="quantity" type="number" placeholder="선택 사항" value={form.quantity} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_time">할인 시작일시</Label>
                  <Input id="start_time" name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">할인 종료일시</Label>
                  <Input id="end_time" name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} required />
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