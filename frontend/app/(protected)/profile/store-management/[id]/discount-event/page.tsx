"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Gift, Calendar, Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { useAppContext } from "@/contexts/app-context";

// ✅ 이벤트 생성 훅/스키마
import { createEventSchema, type CreateEventInput } from "@/app/(protected)/profile/store-management/[id]/discount-event/event.form";
import { useCreateEvent } from "@/hooks/events/use-create-event";

// ✅ 이벤트 조회 훅/뷰모델
import { useGetEvents } from "@/hooks/events/use-get-events";
import { buildEventsListVM } from "@/lib/event-vm";
import { weekdayLabelMap } from "@/lib/vm/utils/utils";

type EventDiscountItem = {
  menuId: string;
  menuName: string;
  originalPrice: number;
  discountRate: number;
  finalPrice: number;
  quantity: number;
};

export default function ManageDiscountEventsPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };
  const { appState } = useAppContext();
const isStoreLoading = false;
const storeError = false;
const store = true;

  // 이벤트 목록 조회 (집계 모드 + 하위(할인/증정) 활성만)
  const {
    data: eventsVM,
    isLoading: eventsLoading,
    error: eventsError,
  } = useGetEvents(
    {
      storeId,
      includeAggregate: true,
      childActiveOnly: true,
      isActive: undefined,        // 전체 / 필요시 true로 변경
      sort: "created_at:desc",
      limit: 100,
    },
    {
      select: (resp) => buildEventsListVM(resp),
    }
  );

  // 이벤트 생성 훅
  const createEvent = useCreateEvent({
    onSuccess: () => {
      setDialogOpen(false);
      router.refresh();
    },
  });

  // 로컬 폼 상태
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState("");       // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");           // YYYY-MM-DD
  const [startTime, setStartTime] = useState("09:00");  // HH:mm
  const [endTime, setEndTime] = useState("21:00");      // HH:mm
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [eventDiscounts, setEventDiscounts] = useState<EventDiscountItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const isSubmitting = createEvent.isPending;

  // 요일 토글
  const handleDaysOfWeekChange = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // 할인 항목
  const handleAddDiscountItem = () => {
    setEventDiscounts((prev) => [
      ...prev,
      { menuId: "", menuName: "", originalPrice: 0, discountRate: 0, finalPrice: 0, quantity: 1 },
    ]);
  };

  const handleDiscountItemChange = (
    index: number,
    field: keyof EventDiscountItem,
    value: any
  ) => {
    setEventDiscounts((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === "discountRate" || field === "originalPrice") {
        item.finalPrice = Math.round(item.originalPrice * (1 - (item.discountRate || 0) / 100));
      } else if (field === "finalPrice") {
        if (item.originalPrice > 0) {
          const newRate = ((item.originalPrice - item.finalPrice) / item.originalPrice) * 100;
          item.discountRate = Math.round(newRate);
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

  // 제출
  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      setError("Store ID is missing.");
      return;
    }
    setError("");

    const payload: CreateEventInput = {
      event: {
        storeId,
        title: eventTitle,
        description: eventDescription || undefined,
        startDate,
        endDate,
        weekdays: daysOfWeek.length ? (daysOfWeek as any) : undefined, // ["MON","TUE",...]
        happyHourStartTime: startTime,
        happyHourEndTime: endTime,
        isActive: true,
      },
      discounts: eventDiscounts.map((d) => ({
        menuId: d.menuId,
        discountRate: d.discountRate,
        finalPrice: d.finalPrice,
        remaining: d.quantity, // 스키마의 remaining으로 매핑
        isActive: true,
      })),
      giftGroups: [],
    };

    try {
      createEventSchema.parse(payload); // 클라 검증
      createEvent.mutate(payload);      // 전송
    } catch (err: any) {
      setError(err.message ?? "유효성 검증 실패");
    }
  };

  // 로딩/에러 처리
  if (isStoreLoading || eventsLoading) return <Skeleton className="h-screen w-full" />;
  if (storeError) return <div className="text-red-500">Error: {storeError.message}</div>;
  if (eventsError) return <div className="text-red-500">Error: {eventsError.message}</div>;
  if (!store) return <div>Store not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
      {/* 헤더 */}
      <div className="w-full max-w-2xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/profile/store-management/${storeId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-teal-600">{store.name}</h2>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ 할인 이벤트 등록</Button>
      </div>

      {/* 이벤트 리스트 (useGetEvents + VM) */}
      <div className="w-full max-w-2xl space-y-4">
        {eventsVM && eventsVM.items.length > 0 ? (
          eventsVM.items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                    <Gift className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{item.title}</div>
                    {item.description ? (
                      <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {item.periodText}
                      </span>
                      {item.happyHourText && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {item.happyHourText}
                        </span>
                      )}
                      {item.weekdaysText && <span>{item.weekdaysText}</span>}
                    </div>

                    {/* 집계 요약 */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.discountSummary && (
                        <span className="text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded">
                          할인 {item.discountSummary.count}개
                          {typeof item.discountSummary.maxRate === 'number' &&
                            ` / 최대 ${item.discountSummary.maxRate}%`}
                        </span>
                      )}
                      {item.giftSummary && item.giftSummary.optionCount > 0 && (
                        <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded">
                          증정 {item.giftSummary.groupCount}그룹 / 옵션 {item.giftSummary.optionCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* (선택) 삭제/수정 버튼 – 삭제 API 붙이면 핸들러 연결 */}
                {/* <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" /> 수정
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(item.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> 삭제
                  </Button>
                </div> */}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <p className="text-gray-600">
              등록된 이벤트가 없습니다. “할인 이벤트 등록”을 눌러 추가하세요.
            </p>
          </Card>
        )}
      </div>

      {/* 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>할인 이벤트 등록</DialogTitle>
            <CardDescription>새로운 할인 이벤트의 상세 정보를 입력하세요.</CardDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEvent} className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader><CardTitle>이벤트 기본 정보</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="event-title">이벤트명</Label>
                  <Input
                    id="event-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event-description">이벤트 설명</Label>
                  <Textarea
                    id="event-description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="이벤트에 대한 설명을 입력하세요."
                  />
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

            {/* 메뉴/할인 설정 */}
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
                            // 최종가/할인율 재계산
                            handleDiscountItemChange(index, "discountRate", item.discountRate);
                          }
                        }}
                      >
                        <SelectTrigger id={`menu-select-${index}`}>
                          <SelectValue placeholder="메뉴 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {store.menu?.map((menu) => (
                            <SelectItem key={menu.id} value={menu.id}>
                              {menu.name} ({menu.originalPrice.toLocaleString()}원)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`discount-rate-${index}`}>할인율(%)</Label>
                      <Input
                        id={`discount-rate-${index}`}
                        className="w-24"
                        type="number"
                        value={item.discountRate}
                        onChange={(e) =>
                          handleDiscountItemChange(index, "discountRate", Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`final-price-${index}`}>최종가</Label>
                      <Input
                        id={`final-price-${index}`}
                        className="w-24"
                        type="number"
                        value={item.finalPrice}
                        onChange={(e) =>
                          handleDiscountItemChange(index, "finalPrice", Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`quantity-${index}`}>수량</Label>
                      <Input
                        id={`quantity-${index}`}
                        className="w-24"
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleDiscountItemChange(index, "quantity", Number(e.target.value))
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveDiscountItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={handleAddDiscountItem}>
                  <Plus className="h-4 w-4 mr-2" /> 메뉴 추가
                </Button>
              </CardContent>
            </Card>

            {/* 에러 / 제출 */}
            {error && (
              <div className="text-red-500 text-sm text-center font-medium">{error}</div>
            )}
            {createEvent.isError && (
              <div className="text-red-500 text-sm text-center font-medium">
                {(createEvent.error as Error)?.message ?? "이벤트 생성 실패"}
              </div>
            )}
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