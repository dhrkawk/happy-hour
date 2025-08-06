"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DiscountApiClient } from "@/lib/services/discounts/discount.api-client";
import {
  DiscountFormViewModel,
  DiscountDetailViewModel,
  createDiscountFormViewModel,
} from "@/lib/viewmodels/discounts/discount.viewmodel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MenuApiClient } from "@/lib/services/menus/menu.api-client";
import { MenuEntity } from "@/lib/entities/menus/menu.entity";

export default function ManageDiscountPage() {
  const { id: storeId, menuId } = useParams() as { id: string; menuId: string };
  const statuses = ["all", "scheduled", "active", "expired"] as const;
  type Status = typeof statuses[number];

  const [discounts, setDiscounts] = useState<DiscountDetailViewModel[]>([]);
  const [menu, setMenu] = useState<MenuEntity | null>(null);
  const [selected, setSelected] = useState<DiscountDetailViewModel | null>(null);
  const [form, setForm] = useState<DiscountFormViewModel & { final_price?: number }>(createDiscountFormViewModel(storeId, menuId));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "scheduled" | "active" | "expired">("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const menuApiClient = new MenuApiClient(storeId);
      const [discountData, menuData] = await Promise.all([
        DiscountApiClient.getDiscountsByMenuId(storeId, menuId),
        menuApiClient.getMenuById(menuId),
      ]);
      setDiscounts(discountData);
      setMenu(menuData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [menuId]);

  const openCreateDialog = () => {
    setForm(createDiscountFormViewModel(storeId, menuId));
    setIsNew(true);
    setSelected(null);
    setDialogOpen(true);
  };

  const openEditDialog = (d: DiscountDetailViewModel) => {
    if (!menu) return; // 메뉴 정보가 없으면 처리하지 않음
    const calculatedFinalPrice = Math.round(menu.price * (1 - d.discount_rate / 100));
    setForm({
      menu_id: menuId,
      store_id: storeId,
      discount_rate: d.discount_rate,
      quantity: d.quantity,
      start_time: new Date(d.start_time).toISOString().slice(0, 16),
      end_time: new Date(d.end_time).toISOString().slice(0, 16),
      final_price: calculatedFinalPrice,
    });
    setIsNew(false);
    setSelected(d);
    setDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "final_price") {
      const finalPrice = Number(value);
      if (menu && menu.price > 0) {
        const discountRate = Math.round(((menu.price - finalPrice) / menu.price) * 100);
        setForm((prev) => ({
          ...prev,
          discount_rate: discountRate,
          final_price: finalPrice,
        }));
      }
    } else if (name === "discount_rate") {
      const discountRate = Number(value);
      if (menu && menu.price > 0) {
        const finalPrice = Math.round(menu.price * (1 - discountRate / 100));
        setForm((prev) => ({
          ...prev,
          discount_rate: discountRate,
          final_price: finalPrice,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          discount_rate: discountRate,
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: name === "quantity" ? Number(value) : value,
      }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isNew) {
        await DiscountApiClient.registerDiscount(form);
      } else if (selected) {
        const { final_price, ...restForm } = form; // final_price는 API로 보내지 않음
        await DiscountApiClient.updateDiscount(selected.id, restForm);
      }
      await loadData();
      setDialogOpen(false);
    } catch (err: any) {
      if (err.message.includes("동일한 기간에 활성 할인이 있습니다!")) {
        alert("동일한 기간에 활성 할인이 있습니다!");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      await DiscountApiClient.deleteDiscount(selected.id);
      await loadData();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndDiscount = async (discountId: string) => {
    if (!confirm("정말로 할인을 종료하시겠습니까?")) return;
    setLoading(true);
    try {
      await DiscountApiClient.endDiscount(discountId);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiscounts = selectedStatus === "all"
    ? discounts
    : discounts.filter((d) => d.status === selectedStatus);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-teal-600">할인 히스토리</h2>
          {menu && <p className="text-sm text-gray-500">메뉴: {menu.name} (원가: {menu.price.toLocaleString()}원)</p>}
        </div>
        <Button onClick={openCreateDialog} size="sm">
          + 새 할인
        </Button>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-4">
        {statuses.map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus(status)}
          >
            {{
              all: "전체",
              scheduled: "예정",
              active: "진행 중",
              expired: "종료됨",
            }[status]}
          </Button>
        ))}
      </div>

      {/* 할인 카드 목록 */}
      {loading ? (
        <div className="flex items-center justify-center text-gray-500 h-32">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> 불러오는 중...
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <p className="text-center text-gray-500">해당 상태의 할인 이력이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {filteredDiscounts.map((d) => (
            <div
              key={d.id}
              className="p-4 border border-gray-200 rounded"
            >
              <div
                className={d.status !== "expired" ? "cursor-pointer" : ""}
                onClick={() => d.status !== "expired" && openEditDialog(d)}
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{d.discount_rate}% 할인</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      d.status === "active"
                        ? "bg-green-100 text-green-700"
                        : d.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {{
                      active: "진행 중",
                      scheduled: "예정됨",
                      expired: "종료됨",
                    }[d.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(d.start_time).toLocaleString()} ~ {new Date(d.end_time).toLocaleString()}
                </p>
              </div>
              {d.status === "active" && (
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => handleEndDiscount(d.id)}
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                  >
                    할인 종료하기
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isNew ? "할인 등록" : "할인 수정"}</DialogTitle>
            <DialogDescription>
              {isNew ? "새로운 할인 정보를 입력하세요." : "선택한 할인 정보를 수정합니다."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {menu && (
              <div>
                <Label>메뉴 원가</Label>
                <Input type="text" value={`${menu.price.toLocaleString()}원`} readOnly disabled />
              </div>
            )}
            <div>
              <Label htmlFor="final_price">할인될 최종 가격</Label>
              <Input
                name="final_price"
                type="number"
                value={form.final_price || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="discount_rate">할인율 (%)</Label>
              <Input
                name="discount_rate"
                type="number"
                value={form.discount_rate || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">수량 (선택)</Label>
              <Input name="quantity" type="number" value={form.quantity || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="start_time">시작 시간</Label>
              <Input name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="end_time">종료 시간</Label>
              <Input name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} required />
            </div>
            <DialogFooter className="flex justify-between pt-4">
              <Button type="submit" className="bg-teal-600 text-white">
                {loading ? "처리 중..." : isNew ? "할인 등록" : "수정 저장"}
              </Button>
              {!isNew && (
                <Button type="button" onClick={handleDelete} className="bg-red-500 text-white">
                  삭제
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}