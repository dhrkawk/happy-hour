'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { MenuApiClient } from "@/lib/services/menus/menu.api-client";
import { MenuEntity } from "@/lib/entities/menus/menu.entity";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useGetDiscountsByMenu } from "@/hooks/use-get-discounts-by-menu";

// Helper function to convert UTC date string to local YYYY-MM-DDTHH:mm format
const convertToLocalInputFormat = (utcDateString: string) => {
  if (!utcDateString) return "";
  const date = new Date(utcDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function ManageDiscountPage() {
  const router = useRouter();
  const { id: storeId, menuId } = useParams() as { id: string; menuId: string };
  const statuses = ["all", "scheduled", "active", "expired"] as const;
  type Status = typeof statuses[number];

  // Refactored data fetching with custom hook
  const { discounts, isLoading: isLoadingDiscounts, error: discountsError, mutate: mutateDiscounts } = useGetDiscountsByMenu(storeId, menuId);

  const [menu, setMenu] = useState<MenuEntity | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [selected, setSelected] = useState<DiscountDetailViewModel | null>(null);
  const [form, setForm] = useState<DiscountFormViewModel & { final_price?: number }>(createDiscountFormViewModel(menuId));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status>("all");

  const formatDateTimeForDisplay = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoadingMenu(true);
      try {
        const menuApiClient = new MenuApiClient(storeId);
        const menuData = await menuApiClient.getMenuById(menuId);
        setMenu(menuData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenu();
  }, [storeId, menuId]);

  const openCreateDialog = () => {
    setForm(createDiscountFormViewModel(menuId));
    setIsNew(true);
    setSelected(null);
    setDialogOpen(true);
  };

  const openEditDialog = (d: DiscountDetailViewModel) => {
    if (!menu) return;
    if (!menu) return;
    const calculatedFinalPrice = Math.round(menu.price * (1 - d.discount_rate / 100));
    setForm({
      menu_id: menuId,
      discount_rate: d.discount_rate,
      quantity: d.quantity,
      start_time: convertToLocalInputFormat(d.start_time),
      end_time: convertToLocalInputFormat(d.end_time),
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
        setForm((prev) => ({ ...prev, discount_rate: discountRate, final_price: finalPrice }));
      }
    } else if (name === "discount_rate") {
      const discountRate = Number(value);
      if (menu && menu.price > 0) {
        const finalPrice = Math.round(menu.price * (1 - discountRate / 100));
        setForm((prev) => ({ ...prev, discount_rate: discountRate, final_price: finalPrice }));
      } else {
        setForm((prev) => ({ ...prev, discount_rate: discountRate }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: name === "quantity" ? Number(value) : value }));
    }
  };

  const handleDateTimeChange = (name: 'start_time' | 'end_time', value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Convert local datetime string to UTC ISO string before sending
      const formDataForApi = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      };
      
      // Remove final_price before sending to API
      const { final_price, ...restForm } = formDataForApi;

      if (isNew) {
        await DiscountApiClient.registerDiscount(restForm);
      } else if (selected) {
        const { final_price, ...restForm } = form;
        await DiscountApiClient.updateDiscount(selected.id, restForm);
      }
      mutateDiscounts(); // Re-fetch discounts
      setDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    setIsSubmitting(true);
    try {
      await DiscountApiClient.deleteDiscount(selected.id);
      mutateDiscounts(); // Re-fetch discounts
      setDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndDiscount = async (discountId: string) => {
    if (!confirm("정말로 할인을 종료하시겠습니까?")) return;
    setIsSubmitting(true);
    try {
      await DiscountApiClient.endDiscount(discountId);
      mutateDiscounts(); // Re-fetch discounts
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDiscounts = selectedStatus === "all"
    ? discounts
    : discounts.filter((d) => d.status === selectedStatus);

  const isLoading = isLoadingDiscounts || isLoadingMenu;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/profile/store-management/${storeId}/discount`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-teal-600">할인 히스토리</h2>
            {menu && <p className="text-sm text-gray-500">메뉴: {menu.name} (원가: {menu.price.toLocaleString()}원)</p>}
          </div>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          + 새 할인
        </Button>
      </div>

      {/* Status Filter */}
      {/* Status Filter */}
      <div className="flex gap-2 mb-4">
        {statuses.map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus(status)}
          >
            {{ all: "전체", scheduled: "예정", active: "진행 중", expired: "종료됨" }[status]}
          </Button>
        ))}
      </div>

      {/* Discount List */}
      {isLoading ? (
        <div className="flex items-center justify-center text-gray-500 h-32">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> 불러오는 중...
        </div>
      ) : discountsError ? (
        <p className="text-center text-red-500">오류가 발생했습니다: {discountsError.message}</p>
      ) : filteredDiscounts.length === 0 ? (
        <p className="text-center text-gray-500">해당 상태의 할인 이력이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {filteredDiscounts.map((d) => (
            <div key={d.id} className="p-4 border border-gray-200 rounded">
              <div
                className={d.status !== "expired" ? "cursor-pointer" : ""}
                onClick={() => d.status !== "expired" && openEditDialog(d)}
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{d.discount_rate}% 할인</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      d.status === "active" ? "bg-green-100 text-green-700"
                      : d.status === "scheduled" ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {{ active: "진행 중", scheduled: "예정됨", expired: "종료됨" }[d.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDateTimeForDisplay(d.start_time)} ~ {formatDateTimeForDisplay(d.end_time)}
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

      {/* Dialog */}
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
              <Input name="final_price" type="number" value={form.final_price || ''} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="discount_rate">할인율 (%)</Label>
              <Input name="discount_rate" type="number" value={form.discount_rate || ''} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="quantity">수량 (선택)</Label>
              <Input name="quantity" type="number" value={form.quantity || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="start_time">시작 시간</Label>
              <DateTimePicker id="start_time" value={form.start_time} onChange={(value) => handleDateTimeChange("start_time", value)} />
            </div>
            <div>
              <Label htmlFor="end_time">종료 시간</Label>
              <DateTimePicker id="end_time" value={form.end_time} onChange={(value) => handleDateTimeChange("end_time", value)} />
            </div>
            <DialogFooter className="flex justify-between pt-4">
              <Button type="submit" className="bg-teal-600 text-white" disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : isNew ? "할인 등록" : "수정 저장"}
              </Button>
              {!isNew && (
                <Button type="button" onClick={handleDelete} className="bg-red-500 text-white" disabled={isSubmitting}>
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