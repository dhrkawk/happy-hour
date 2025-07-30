"use client";
import { useState, useEffect } from "react";
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
import { DiscountFormViewModel } from "@/lib/viewmodels/discounts/discount.viewmodel";
import { MenuApiClient } from "@/lib/services/menus/menu.api-client";
import { DiscountApiClient } from "@/lib/services/discounts/discount.api-client";
import { MenuListItemViewModel } from "@/lib/viewmodels/menus/menu.viewmodel";

export default function DiscountManagementPage() {
  const router = useRouter();
  const storeId = params.id;
  const menuApiClient = new MenuApiClient(storeId);
  const discountApiClient = new DiscountApiClient();

  const [menus, setMenus] = useState<MenuListItemViewModel[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [form, setForm] = useState<DiscountFormViewModel>({
    discount_rate: 0,
    quantity: null,
    start_time: "",
    end_time: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 메뉴 목록을 가져오는 훅 (Service Layer를 통해 API 호출)
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const data = await menuApiClient.getMenus();
        setMenus(data);
      } catch (err: any) {
        console.error("Error fetching menus:", err);
        setError(err.message);
      }
    };
    fetchMenus();
  }, [storeId, menuApiClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "menu") {
      setSelectedMenu(value);
    } else {
      setForm({ ...form, [name]: name === "discount_rate" || name === "quantity" ? Number(value) : value });
    }
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

    try {
      await discountApiClient.registerDiscount(form, storeId, selectedMenu);
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="menu">메뉴 선택</Label>
                <select
                  id="menu"
                  name="menu"
                  value={selectedMenu}
                  onChange={handleChange}
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
                  <Label htmlFor="discount_rate">할인율 (%)</Label>
                  <Input id="discount_rate" name="discount_rate" type="number" placeholder="예: 30" value={form.discount_rate} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">할인 수량</Label>
                  <Input id="quantity" name="quantity" type="number" placeholder="선택 사항" value={form.quantity || ""} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_time">할인 시작일시</Label>
                  <Input id="start_time" name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required />
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
