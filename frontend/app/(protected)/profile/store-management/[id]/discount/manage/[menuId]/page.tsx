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

export default function ManageDiscountPage() {
  const { id: storeId, menuId } = useParams() as { id: string; menuId: string };
  const statuses = ["all", "scheduled", "active", "expired"] as const;
  type Status = typeof statuses[number];

  const [discounts, setDiscounts] = useState<DiscountDetailViewModel[]>([]);
  const [selected, setSelected] = useState<DiscountDetailViewModel | null>(null);
  const [form, setForm] = useState<DiscountFormViewModel>(createDiscountFormViewModel(storeId, menuId));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "scheduled" | "active" | "expired">("all");

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await DiscountApiClient.getDiscountsByMenuId(storeId, menuId);
      setDiscounts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, [menuId]);

  const openCreateDialog = () => {
    setForm(createDiscountFormViewModel(storeId, menuId));
    setIsNew(true);
    setSelected(null);
    setDialogOpen(true);
  };

  const openEditDialog = (d: DiscountDetailViewModel) => {
    setForm({
      menu_id: menuId,
      store_id: storeId,
      discount_rate: d.discount_rate,
      quantity: d.quantity,
      start_time: new Date(d.start_time).toISOString().slice(0, 16),
      end_time: new Date(d.end_time).toISOString().slice(0, 16),
    });
    setIsNew(false);
    setSelected(d);
    setDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "discount_rate" || name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isNew) {
        await DiscountApiClient.registerDiscount(form);
      } else if (selected) {
        await DiscountApiClient.updateDiscount(selected.id, form);
      }
      await loadDiscounts();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
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
      await loadDiscounts();
      setDialogOpen(false);
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
        <h2 className="text-lg font-bold text-teal-600">할인 히스토리</h2>
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
              className="p-4 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => openEditDialog(d)}
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
            <div>
              <Label htmlFor="discount_rate">할인율 (%)</Label>
              <Input name="discount_rate" type="number" value={form.discount_rate} onChange={handleChange} required />
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