"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { MenuFormViewModel } from "@/lib/viewmodels/menus/menu.viewmodel";
import { MenuApiClient } from "@/lib/services/menus/menu.api-client";
import { DiscountApiClient } from "@/lib/services/discounts/discount.api-client";

export default function MenuManagementPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const menuApiClient = new MenuApiClient(storeId);
  const discountApiClient = new DiscountApiClient();

  const [form, setForm] = useState<MenuFormViewModel>({
    name: "",
    price: 0,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "price" ? Number(value) : value });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await menuApiClient.registerMenu(form, thumbnail);
      router.push(`/profile/store-management/${storeId}`);
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
            <CardTitle className="text-3xl font-bold text-center text-teal-600">메뉴 등록</CardTitle>
            <CardDescription className="text-center text-gray-500">새로운 메뉴를 등록해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="thumbnail">메뉴 이미지</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="thumbnail"
                    name="thumbnail"
                    type="file"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('thumbnail')?.click()}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    파일 선택
                  </Button>
                  {thumbnail && <span className="text-sm text-gray-600">{thumbnail.name}</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">메뉴명</Label>
                <Input id="name" name="name" placeholder="예: 소금빵" value={form.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">메뉴 가격</Label>
                <Input id="price" name="price" type="number" placeholder="예: 3500" value={form.price} onChange={handleChange} required />
              </div>
              {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors" disabled={loading}>
                {loading ? "등록 중..." : "등록 완료"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}