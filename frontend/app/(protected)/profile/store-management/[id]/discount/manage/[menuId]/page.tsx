"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DiscountApiClient } from "@/lib/services/discounts/discount.api-client";
import { DiscountFormViewModel, DiscountDetailViewModel } from "@/lib/viewmodels/discounts/discount.viewmodel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ManageDiscountPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const menuId = params.menuId as string;

  const [discount, setDiscount] = useState<DiscountDetailViewModel | null>(null);
  const [form, setForm] = useState<DiscountFormViewModel>({
    menu_id: menuId,
    discount_rate: 0,
    quantity: null,
    start_time: "",
    end_time: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    async function fetchDiscount() {
      if (!menuId) return;
      setLoading(true);
      setError(null);
      try {
        const fetchedDiscount = await DiscountApiClient.getDiscountByMenuId(menuId);
        if (fetchedDiscount) {
          setDiscount(fetchedDiscount); 
          setForm({
            menu_id: fetchedDiscount.menu_id,
            discount_rate: fetchedDiscount.discount_rate,
            quantity: fetchedDiscount.quantity || null,
            start_time: new Date(fetchedDiscount.start_time).toISOString().slice(0, 16),
            end_time: new Date(fetchedDiscount.end_time).toISOString().slice(0, 16),
          });
          setIsNew(false);
        } else {
          setIsNew(true);
        }
      } catch (err: any) {
        console.error("Error fetching discount:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDiscount();
  }, [menuId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: name === "discount_rate" || name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isNew) {
        await DiscountApiClient.registerDiscount(form);
      } else {
        if (discount) {
          await DiscountApiClient.updateDiscount(discount.id, form);
        }
      }
      router.push(`/profile/store-management/${storeId}/discount`);
    } catch (err: any) {
      console.error("Error saving discount:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!discount || !confirm("정말로 이 할인을 삭제하시겠습니까?")) return;
    setLoading(true);
    setError(null);
    try {
      await DiscountApiClient.deleteDiscount(discount.id);
      router.push(`/profile/store-management/${storeId}/discount`);
    } catch (err: any) {
      console.error("Error deleting discount:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">할인 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">오류 발생: {error}</h1>
          <Button onClick={() => router.back()} className="bg-teal-500 hover:bg-teal-600 text-white">뒤로 가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-teal-600">
              {isNew ? "할인 등록" : "할인 수정"}
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              {isNew ? "새로운 할인을 등록해주세요." : "할인 정보를 수정하거나 삭제할 수 있습니다."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="discount_rate">할인율 (%)</Label>
                <Input
                  id="discount_rate"
                  name="discount_rate"
                  type="number"
                  value={form.discount_rate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">수량 (선택 사항)</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={form.quantity || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">시작 시간</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  value={form.start_time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">종료 시간</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  value={form.end_time}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors" disabled={loading}>
                {loading ? (isNew ? "등록 중..." : "저장 중...") : (isNew ? "할인 등록" : "할인 저장")}
              </Button>
              {!isNew && (
                <Button type="button" onClick={handleDelete} className="w-full bg-red-500 hover:bg-red-600 text-white text-lg font-semibold py-3 rounded-lg transition-colors mt-4" disabled={loading}>
                  할인 삭제
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
