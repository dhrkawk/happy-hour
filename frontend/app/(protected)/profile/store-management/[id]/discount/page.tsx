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

export default function DiscountManagementPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const storeId = params.id;
  const supabase = createClient();
  const [menus, setMenus] = useState<any[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [form, setForm] = useState({
    discount_rate: "",
    quantity: "",
    start_time: "",
    end_time: "",
  });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "menu") {
      setSelectedMenu(value);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedMenu) {
      setError("메뉴를 선택해주세요.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("menu_id", selectedMenu);
    formData.append("discount_rate", form.discount_rate);
    formData.append("quantity", form.quantity);
    formData.append("start_time", form.start_time);
    formData.append("end_time", form.end_time);

    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "할인 등록에 실패했습니다.");
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
            <CardDescription className="text-center text-gray-500">메뉴를 선택하고 할인 정보를 입력해주세요.</CardDescription>
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
                {loading ? "등록 중..." : "등록 완료"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
