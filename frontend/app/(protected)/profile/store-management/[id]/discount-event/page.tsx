"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiscountApiClient } from "@/lib/services/discounts/discount.api-client";
import { MenuApiClient } from "@/lib/services/menus/menu.api-client";
import { DiscountFormViewModel, createDiscountFormViewModel } from "@/lib/viewmodels/discounts/discount.viewmodel";
import { MenuListItemViewModel } from "@/lib/viewmodels/menus/menu.viewmodel";
import { useGetStoreById } from "@/hooks/use-get-store-by-id";
import { useAppContext } from "@/contexts/app-context";
import { Skeleton } from "@/components/ui/skeleton";

// --- Event Form ViewModel (Placeholder) ---
interface DiscountEventForm {
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[]; // e.g., ['MON', 'TUE']
  // Menus for this event will be managed separately
}

// --- Discount Item for Event (Placeholder) ---
interface EventDiscountItem {
  menuId: string;
  menuName: string;
  originalPrice: number;
  discountRate: number;
  finalPrice: number;
  quantity: number | null;
}

export default function ManageDiscountEventsPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };
  const { appState } = useAppContext();
  const { location } = appState;
  const { store, isLoading: isStoreLoading, error: storeError } = useGetStoreById(storeId, location.coordinates);


  const [eventForm, setEventForm] = useState<DiscountEventForm>({
    name: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "21:00",
    daysOfWeek: [],
  });
  const [eventDiscounts, setEventDiscounts] = useState<EventDiscountItem[]>([]);
  const [allMenus, setAllMenus] = useState<MenuListItemViewModel[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Data Fetching (Menus) ---
  useEffect(() => {
    if (!storeId) return;
    const fetchMenus = async () => {
      try {
        const menuApiClient = new MenuApiClient(storeId);
        const menusData = await menuApiClient.getMenus();
        setAllMenus(menusData);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchMenus();
  }, [storeId]);

  // --- Event Form Handlers ---
  const handleEventFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: 'startDate' | 'endDate', value: string) => {
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (name: 'startTime' | 'endTime', value: string) => {
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDaysOfWeekChange = (day: string, isChecked: boolean) => {
    setEventForm((prev) => ({
      ...prev,
      daysOfWeek: isChecked
        ? [...prev.daysOfWeek, day]
        : prev.daysOfWeek.filter((d) => d !== day),
    }));
  };

  // --- Event Discount Item Handlers ---
  const handleAddDiscountItem = () => {
    // Open a dialog to select menu and set discount details
    // For now, just add a placeholder
    setEventDiscounts((prev) => [
      ...prev,
      { menuId: "", menuName: "선택하세요", originalPrice: 0, discountRate: 0, finalPrice: 0, quantity: null },
    ]);
  };

  const handleDiscountItemChange = (index: number, field: keyof EventDiscountItem, value: any) => {
    setEventDiscounts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    // Recalculate finalPrice if discountRate or originalPrice changes
    if (field === "discountRate" || field === "originalPrice") {
      const updatedItem = { ...eventDiscounts[index], [field]: value };
      const originalPrice = updatedItem.originalPrice;
      const discountRate = updatedItem.discountRate;
      const finalPrice = Math.round(originalPrice * (1 - discountRate / 100));
      setEventDiscounts((prev) =>
        prev.map((item, i) => (i === index ? { ...item, finalPrice } : item))
      );
    }
  };

  const handleRemoveDiscountItem = (index: number) => {
    setEventDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Event Submission (Placeholder) ---
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      // TODO: Call new EventApiClient to register the event and its discounts
      console.log("Submitting Event:", eventForm, eventDiscounts);
      // Example: await EventApiClient.registerEvent(eventForm, eventDiscounts);
      setDialogOpen(false);
      router.push(`/profile/store-management/${storeId}/discount-event`); // Redirect or refresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isStoreLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (storeError) {
    return <div className="text-red-500 text-center p-4">Error loading store data: {storeError.message}</div>;
  }

  if (!store) {
    return <div className="text-center p-4">Store not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
      <div className="w-full max-w-2xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/profile/store-management/${storeId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-teal-600">{store.name}</h2>
            <p className="text-sm text-gray-500">{store.address}</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ 할인 이벤트 등록</Button>
      </div>

      {/* Existing Events List (Placeholder) */}
      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>등록된 할인 이벤트</CardTitle>
            <CardDescription>여기에 등록된 할인 이벤트 목록이 표시됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">아직 등록된 할인 이벤트가 없습니다.</p>
          </CardContent>
        </Card>
      </div>

      {/* Discount Event Registration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>할인 이벤트 등록</DialogTitle>
            <CardDescription>새로운 할인 이벤트의 상세 정보를 입력하세요.</CardDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEvent} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>이벤트 기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="eventName">이벤트명</Label>
                  <Input id="eventName" name="name" value={eventForm.name} onChange={handleEventFormChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">시작 날짜</Label>
                    <DatePicker id="startDate" value={eventForm.startDate} onChange={(value) => handleDateChange("startDate", value)} />
                  </div>
                  <div>
                    <Label htmlFor="endDate">종료 날짜</Label>
                    <DatePicker id="endDate" value={eventForm.endDate} onChange={(value) => handleDateChange("endDate", value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">시작 시간</Label>
                    <TimePicker id="startTime" value={eventForm.startTime} onChange={(value) => handleTimeChange("startTime", value)} />
                  </div>
                  <div>
                    <Label htmlFor="endTime">종료 시간</Label>
                    <TimePicker id="endTime" value={eventForm.endTime} onChange={(value) => handleTimeChange("endTime", value)} />
                  </div>
                </div>
                <div>
                  <Label>적용 요일</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={eventForm.daysOfWeek.includes(day) ? "default" : "outline"}
                        onClick={() => handleDaysOfWeekChange(day, !eventForm.daysOfWeek.includes(day))}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>이벤트 메뉴 및 할인 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventDiscounts.map((item, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`menu-${index}`}>메뉴</Label>
                      <Select
                        value={item.menuId}
                        onValueChange={(value) => {
                          const selectedMenu = allMenus.find(m => m.id === value);
                          if (selectedMenu) {
                            handleDiscountItemChange(index, "menuId", value);
                            handleDiscountItemChange(index, "menuName", selectedMenu.name);
                            handleDiscountItemChange(index, "originalPrice", selectedMenu.price);
                            // Reset discount values when menu changes
                            handleDiscountItemChange(index, "discountRate", 0);
                            handleDiscountItemChange(index, "finalPrice", selectedMenu.price);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="메뉴 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {allMenus.map((menu) => (
                            <SelectItem key={menu.id} value={menu.id}>
                              {menu.name} ({menu.price.toLocaleString()}원)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`discountRate-${index}`}>할인율 (%)</Label>
                      <Input
                        id={`discountRate-${index}`}
                        type="number"
                        value={item.discountRate}
                        onChange={(e) => handleDiscountItemChange(index, "discountRate", Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`finalPrice-${index}`}>최종가</Label>
                      <Input
                        id={`finalPrice-${index}`}
                        type="number"
                        value={item.finalPrice}
                        onChange={(e) => handleDiscountItemChange(index, "finalPrice", Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`quantity-${index}`}>수량</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        value={item.quantity ?? ''}
                        onChange={(e) => handleDiscountItemChange(index, "quantity", Number(e.target.value))}
                      />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveDiscountItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddDiscountItem}>
                  <Plus className="h-4 w-4 mr-2" /> 메뉴 추가
                </Button>
              </CardContent>
            </Card>

            {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
            <DialogFooter className="flex justify-end pt-4">
              <Button type="submit" className="bg-teal-600 text-white" disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : "이벤트 등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
