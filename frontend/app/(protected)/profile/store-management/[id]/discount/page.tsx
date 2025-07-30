"use client";
import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface DiscountForm {
  menu_id: string;
  discount_rate: string;
  quantity: string;
}

import { useParams } from "next/navigation";

export default function DiscountManagementPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const supabase = createClient();
  const [menus, setMenus] = useState<any[]>([]);
  const [discountCount, setDiscountCount] = useState(1);
  const [forms, setForms] = useState<DiscountForm[]>(
    Array.from({ length: discountCount }, () => ({ menu_id: "", discount_rate: "", quantity: "" }))
  );
  const [timeRange, setTimeRange] = useState({ start_time: "", end_time: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMenus = async () => {
      const { data, error } = await supabase
        .from("store_menus")
        .select("id, name")
        .eq("store_id", storeId);
      if (error) {
        console.error("Error fetching menus:", error);
      } else {
        setMenus(data);
      }
    };
    fetchMenus();
  }, [storeId, supabase]);

  const handleDiscountCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 20) {
      setDiscountCount(newCount);
      const newForms = Array.from({ length: newCount }, (_, i) =>
        forms[i] || { menu_id: "", discount_rate: "", quantity: "" }
      );
      setForms(newForms);
    }
  };

  const handleFormChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const newForms = [...forms];
    newForms[index] = { ...newForms[index], [e.target.name]: e.target.value };
    setForms(newForms);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeRange({ ...timeRange, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      for (const form of forms) {
        if (!form.menu_id) {
          throw new Error("모든 할인 항목에 메뉴를 선택해주세요.");
        }

        const formData = new FormData();
        formData.append("store_id", storeId);
        formData.append("menu_id", form.menu_id);
        formData.append("discount_rate", form.discount_rate);
        formData.append("quantity", form.quantity);
        formData.append("start_time", timeRange.start_time);
        formData.append("end_time", timeRange.end_time);

        const res = await fetch("/api/discounts", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `할인 등록에 실패했습니다: ${form.menu_id}`);
        }
      }
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
            <CardTitle className="text-3xl font-bold text-center text-teal-600">할인 관리</CardTitle>
            <CardDescription className="text-center text-gray-500">
              할인 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">할인 시간 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">할인 시작일시</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="datetime-local"
                      value={timeRange.start_time}
                      onChange={handleTimeChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">할인 종료일시</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="datetime-local"
                      value={timeRange.end_time}
                      onChange={handleTimeChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDiscountCountChange(discountCount - 1)}
                  disabled={discountCount <= 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold">{discountCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDiscountCountChange(discountCount + 1)}
                  disabled={discountCount >= 20}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {forms.map((form, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold">할인 항목 {index + 1}</h3>
                  <div className="space-y-2">
                    <Label htmlFor={`menu_id-${index}`}>메뉴 선택</Label>
                    <select
                      id={`menu_id-${index}`}
                      name="menu_id"
                      value={form.menu_id}
                      onChange={(e) => handleFormChange(index, e)}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="" disabled>메뉴를 선택하세요</option>
                      {menus.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`discount_rate-${index}`}>할인율 (%)</Label>
                      <Input
                        id={`discount_rate-${index}`}
                        name="discount_rate"
                        type="number"
                        placeholder="예: 30"
                        value={form.discount_rate}
                        onChange={(e) => handleFormChange(index, e)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`}>할인 수량</Label>
                      <Input
                        id={`quantity-${index}`}
                        name="quantity"
                        type="number"
                        placeholder="선택 사항"
                        value={form.quantity}
                        onChange={(e) => handleFormChange(index, e)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? "등록 중..." : "등록 완료"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
