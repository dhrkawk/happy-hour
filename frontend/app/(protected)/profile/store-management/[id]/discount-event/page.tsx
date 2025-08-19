// 리팩토링된 전체 페이지 코드는 여기에 삽입됩니다.
// 개별 컴포넌트 분리 및 파일 정리 가능하지만,
// 아래는 단일 파일로 유지되어 바로 사용 가능한 구조입니다.

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
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/contexts/app-context";
import { useGetStoreById } from "@/hooks/use-get-store-by-id";
import { EventApiClient } from "@/lib/services/events/event.api-client";
import { EventFormViewModel } from "@/lib/viewmodels/events/event-form.viewmodel";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Edit, Gift, CheckCircle2, XCircle } from "lucide-react";
import { weekdayLabelMap } from "@/lib/utils";
interface EventDiscountItem {
  menuId: string;
  menuName: string;
  originalPrice: number;
  discountRate: number;
  finalPrice: number;
  quantity: number;
}

export default function ManageDiscountEventsPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };
  const { appState } = useAppContext();
  const { store, isLoading: isStoreLoading, error: storeError } = useGetStoreById(storeId, appState.location.coordinates);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [eventDiscounts, setEventDiscounts] = useState<EventDiscountItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleDaysOfWeekChange = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddDiscountItem = () => {
    setEventDiscounts((prev) => [
      ...prev,
      { menuId: "", menuName: "", originalPrice: 0, discountRate: 0, finalPrice: 0, quantity: 1 },
    ]);
  };

  const handleDiscountItemChange = (index: number, field: keyof EventDiscountItem, value: any) => {
    setEventDiscounts((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === "discountRate" || field === "originalPrice") {
        item.finalPrice = Math.round(item.originalPrice * (1 - (item.discountRate || 0) / 100));
      } else if (field === "finalPrice") {
        if (item.originalPrice > 0) {
          const newDiscountRate = ((item.originalPrice - item.finalPrice) / item.originalPrice) * 100;
          item.discountRate = Math.round(newDiscountRate);
        } else {
          item.discountRate = 0;
        }
      }
      
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveDiscountItem = (index: number) => {
    setEventDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return setError("Store ID is missing.");
    setIsSubmitting(true);
    setError("");

    // Calculate max values from discounts
    const max_discount_rate = eventDiscounts.length > 0 ? Math.max(...eventDiscounts.map(d => d.discountRate)) : undefined;
    const max_final_price = eventDiscounts.length > 0 ? Math.max(...eventDiscounts.map(d => d.finalPrice)) : undefined;
    const max_original_price = eventDiscounts.length > 0 ? Math.max(...eventDiscounts.map(d => d.originalPrice)) : undefined;

    const payload: EventFormViewModel = {
      eventData: {
        store_id: storeId,
        title: eventTitle,
        description: eventDescription,
        start_date: startDate,
        end_date: endDate,
        happyhour_start_time: `${startTime}:00`,
        happyhour_end_time: `${endTime}:00`,
        weekdays: daysOfWeek,
        max_discount_rate,
        max_final_price,
        max_original_price,
      },
      discounts: eventDiscounts.map((d) => ({
        menu_id: d.menuId,
        discount_rate: d.discountRate,
        final_price: d.finalPrice,
        quantity: d.quantity,
        is_active: true,
      })),
      gifts: [],
    };

    try {
      const eventApiClient = new EventApiClient();
      await eventApiClient.registerEvent(payload);
      setDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isStoreLoading) return <Skeleton className="h-screen w-full" />;
  if (storeError) return <div className="text-red-500">Error: {storeError.message}</div>;
  if (!store) return <div>Store not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
      <div className="w-full max-w-2xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/profile/store-management/${storeId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-teal-600">{store.name}</h2>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ 할인 이벤트 등록</Button>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {store.events && store.events.length > 0 ? (
          store.events.map((event) => {
            const now = new Date();
            const isActive = new Date(event.startDate) <= now && now <= new Date(event.endDate);

            return (
              <Card key={event.id} className="p-4 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                    <Gift className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{event.title}</p>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="w-4 h-4" /> 활성
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
                          <XCircle className="w-4 h-4" /> 비활성
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.startDate).toLocaleDateString()} ~ {new Date(event.endDate).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.happyHourStartTime} ~ {event.happyHourEndTime}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" /> 수정
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-1" /> 삭제
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-6">
            <p className="text-gray-600">등록된 이벤트가 없습니다. “할인 이벤트 등록”을 눌러 추가하세요.</p>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>할인 이벤트 등록</DialogTitle>
            <CardDescription>새로운 할인 이벤트의 상세 정보를 입력하세요.</CardDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEvent} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>이벤트 기본 정보</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="event-title">이벤트명</Label>
                  <Input id="event-title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="event-description">이벤트 설명</Label>
                  <Textarea id="event-description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="이벤트에 대한 설명을 입력하세요." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">시작 날짜</Label>
                    <DatePicker id="start-date" value={startDate} onChange={setStartDate} />
                  </div>
                  <div>
                    <Label htmlFor="end-date">종료 날짜</Label>
                    <DatePicker id="end-date" value={endDate} onChange={setEndDate} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">시작 시간</Label>
                    <TimePicker id="start-time" value={startTime} onChange={setStartTime} />
                  </div>
                  <div>
                    <Label htmlFor="end-time">종료 시간</Label>
                    <TimePicker id="end-time" value={endTime} onChange={setEndTime} />
                  </div>
                </div>
                <div>
                  <Label>적용 요일</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {Object.entries(weekdayLabelMap).map(([key, label]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={daysOfWeek.includes(key) ? "default" : "outline"}
                        onClick={() => handleDaysOfWeekChange(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>이벤트 메뉴 및 할인 설정</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {eventDiscounts.map((item, index) => (
                  <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`menu-select-${index}`}>메뉴</Label>
                      <Select
                        value={item.menuId}
                        onValueChange={(value) => {
                          const selected = store.menu?.find((m) => m.id === value);
                          if (selected) {
                            handleDiscountItemChange(index, "menuId", selected.id);
                            handleDiscountItemChange(index, "menuName", selected.name);
                            handleDiscountItemChange(index, "originalPrice", selected.originalPrice);
                          }
                        }}
                      >
                        <SelectTrigger id={`menu-select-${index}`}><SelectValue placeholder="메뉴 선택" /></SelectTrigger>
                        <SelectContent>
                          {store.menu?.map((menu) => (
                            <SelectItem key={menu.id} value={menu.id}>{menu.name} ({menu.originalPrice.toLocaleString()}원)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`discount-rate-${index}`}>할인율(%)</Label>
                      <Input id={`discount-rate-${index}`} className="w-24" type="number" value={item.discountRate} onChange={(e) => handleDiscountItemChange(index, "discountRate", Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`final-price-${index}`}>최종가</Label>
                      <Input id={`final-price-${index}`} className="w-24" type="number" value={item.finalPrice} onChange={(e) => handleDiscountItemChange(index, "finalPrice", Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`quantity-${index}`}>수량</Label>
                      <Input id={`quantity-${index}`} className="w-24" type="number" value={item.quantity} onChange={(e) => handleDiscountItemChange(index, "quantity", Number(e.target.value))} />
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

            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
            <DialogFooter>
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
