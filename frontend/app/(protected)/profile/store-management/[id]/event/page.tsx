"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock } from "lucide-react";
import {
  useForm,
  useFieldArray,
  UseFormReturn,
  UseFieldArrayReturn,
} from "react-hook-form";

import {
  CreateEventWithDiscountsAndGiftsSchema,
  CreateEventWithDiscountsAndGiftsDTO,
  UpdateEventWithDiscountsAndGiftsSchema,
  UpdateEventWithDiscountsAndGiftsDTO,
} from "@/domain/schemas/schemas";

import {
  useGetEventsByStoreId,
  useGetEventWithDiscountsAndGifts,
  // ✅ 새로 사용할 생성 훅
  useCreateEventWithDiscountsAndGifts,
  useUpdateEventWithDiscountsAndGifts,
} from "@/hooks/usecases/events.usecase";

import { useGetMenusByStoreId } from "@/hooks/usecases/menus.usecase";

import {
  EventWithDiscountsAndGifts,
  StoreMenu,
} from "@/domain/entities/entities";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Pencil } from "lucide-react";

/* ---------- 상세 → 생성 DTO 매핑 ---------- */
function toCreateDTOFromDetail(
  storeId: string,
  detail: EventWithDiscountsAndGifts
): CreateEventWithDiscountsAndGiftsDTO {
  const e = detail.event;

  return {
    store_id: storeId,
    start_date: e.startDate as unknown as Date,
    end_date: e.endDate as unknown as Date,
    happy_hour_start_time: (e.happyHourStartTime ?? null) as any,
    happy_hour_end_time: (e.happyHourEndTime ?? null) as any,
    weekdays: (e.weekdays ?? []) as any,
    is_active: !!e.isActive,
    description: e.description ?? null,
    title: e.title ?? "",

    discounts: detail.discounts.map((d) => ({
      id: d.id,
      menu_id: d.menuId,
      discount_rate: d.discountRate,
      remaining: d.remaining ?? null,
      is_active: d.isActive,
      final_price: d.finalPrice,
    })),

    gift_options: detail.giftGroups.flatMap((gg) =>
      gg.options.map((o) => ({
        id: o.id,
        menu_id: o.menuId,
        remaining: o.remaining ?? null,
        is_active: o.isActive,
      }))
    ),
  };
}

/* ---------- 요일 옵션 ---------- */
const WEEKDAYS: Array<{
  label: string;
  value: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
}> = [
  { label: "월", value: "MON" },
  { label: "화", value: "TUE" },
  { label: "수", value: "WED" },
  { label: "목", value: "THU" },
  { label: "금", value: "FRI" },
  { label: "토", value: "SAT" },
  { label: "일", value: "SUN" },
];

/* =============== 메뉴 드롭다운 =============== */
function MenuSelect({
  value,
  onChange,
  menus,
  placeholder = "메뉴를 선택하세요",
  disabled,
}: {
  value?: string;
  onChange: (id: string) => void;
  menus: StoreMenu[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => onChange(v)}
      disabled={disabled || menus.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={menus.length ? placeholder : "메뉴 없음"} />
      </SelectTrigger>
      <SelectContent>
        {menus.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}{" "}
            {typeof m.price === "number" ? `(${m.price.toLocaleString()}원)` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function StoreEventsPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };

  /* ===== 목록 ===== */
  const { data: eventsData, isLoading: listLoading } = useGetEventsByStoreId(
    storeId
  );
  const events = useMemo(
    () => (eventsData ? eventsData : []),
    [eventsData]
  );

  /* ===== 메뉴(드롭다운 옵션) ===== */
  const { data: menusData, isLoading: menusLoading } =
    useGetMenusByStoreId(storeId);
  const menus = useMemo<StoreMenu[]>(
    () => (Array.isArray(menusData) ? menusData : []),
    [menusData]
  );

  /* ===== 다이얼로그 상태 ===== */
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);

  /* ===== 상세 쿼리(수정) ===== */
  const {
    data: detail,
    isLoading: detailLoading,
    isFetching: detailFetching,
  } = useGetEventWithDiscountsAndGifts(editId as string, {
    enabled: editOpen && !!editId,
    onlyActive: false,
  });

  /* ===== 생성 훅(뮤테이션) 연결 ===== */
  const createMutate = useCreateEventWithDiscountsAndGifts();
  const updateMutate = useUpdateEventWithDiscountsAndGifts();

  /* ===== 생성 폼 ===== */
  const createForm = useForm<CreateEventWithDiscountsAndGiftsDTO>({
    resolver: zodResolver(CreateEventWithDiscountsAndGiftsSchema),
    defaultValues: {
      store_id: storeId,
      start_date: new Date(),
      end_date: new Date(),
      happy_hour_start_time: null,
      happy_hour_end_time: null,
      weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
      is_active: true,
      description: null,
      title: "",
      discounts: [],
      gift_options: [],
    },
    mode: "onChange",
  });
  const createDiscounts: UseFieldArrayReturn<
    CreateEventWithDiscountsAndGiftsDTO,
    "discounts",
    "id"
  > = useFieldArray({
    control: createForm.control,
    name: "discounts",
  });
  const createGifts: UseFieldArrayReturn<
    CreateEventWithDiscountsAndGiftsDTO,
    "gift_options",
    "id"
  > = useFieldArray({
    control: createForm.control,
    name: "gift_options",
  });

  /* ===== 수정 폼 ===== */
  // 1) 베이스 폼 타입: id 제외
  type UpdateEventFormValues = Omit<
  UpdateEventWithDiscountsAndGiftsDTO,
  "id"
  >;

  const editForm = useForm<UpdateEventFormValues>({
    resolver: zodResolver(
      // 스키마도 id 제외한 형태로 검증
      UpdateEventWithDiscountsAndGiftsSchema.omit({ id: true })
    ),
    defaultValues: {
      store_id: storeId,
      start_date: new Date(),
      end_date: new Date(),
      happy_hour_start_time: null,
      happy_hour_end_time: null,
      weekdays: ["MON"],
      is_active: true,
      description: null,
      title: "",
      discounts: [],
      gift_options: [],
    },
    mode: "onChange",
  });
  // 4) FieldArray 제네릭도 베이스 타입으로
  const editDiscounts: UseFieldArrayReturn<
    UpdateEventFormValues,
    "discounts",
    "id"
  > = useFieldArray({
    control: editForm.control,
    name: "discounts",
  });

  const editGifts: UseFieldArrayReturn<
    UpdateEventFormValues,
    "gift_options",
    "id"
  > = useFieldArray({
    control: editForm.control,
    name: "gift_options",
  });

  /* ===== 상세 로드 → 수정 폼에 주입 ===== */
  const readyToHydrate = editOpen && !!detail && !detailLoading && !detailFetching;
  if (readyToHydrate) {
    const dto = toCreateDTOFromDetail(storeId, detail!);
    if (editForm.getValues("title") !== dto.title) {
      editForm.reset(dto);
      editDiscounts.replace(dto.discounts);
      editGifts.replace(dto.gift_options ?? []);
    }
  }

  /* ===== Handlers ===== */
  const openCreate = () => {
    setUiError(null);
    createForm.reset({
      store_id: storeId,
      start_date: new Date(),
      end_date: new Date(),
      happy_hour_start_time: null,
      happy_hour_end_time: null,
      weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
      is_active: true,
      description: null,
      title: "",
      discounts: [],
      gift_options: [],
    });
    setCreateOpen(true);
  };

  const openEdit = (id: string) => {
    setUiError(null);
    setEditId(id);
    setEditOpen(true);
  };

  const onSubmitCreate = createForm.handleSubmit((vals) => {
    setUiError(null);
    // 안전 보정(숫자형)
    vals.discounts = (vals.discounts ?? []).map((d) => ({
      ...d,
      discount_rate: Number(d.discount_rate),
      final_price: Number(d.final_price),
      remaining:
        d.remaining === null || d.remaining === undefined
          ? null
          : Number(d.remaining),
    }));
    vals.gift_options = (vals.gift_options ?? []).map((g) => ({
      ...g,
      remaining:
        g.remaining === null || g.remaining === undefined
          ? null
          : Number(g.remaining),
    }));

    createMutate.mutate(vals, {
      onSuccess: (_res) => {
        setCreateOpen(false);
      },
      onError: (e) => {
        setUiError(e.message ?? "이벤트 생성에 실패했습니다.");
      },
    });
  });


  const onSubmitUpdate = editForm.handleSubmit((vals) => {
    setUiError(null);
  
    if (!editId) {
      setUiError("편집할 이벤트 ID가 없습니다.");
      return;
    }
  
    // 숫자형 안전 보정
    const normalizedDiscounts = (vals.discounts ?? []).map((d) => ({
      ...d,
      discount_rate: Number(d.discount_rate),
      final_price: Number(d.final_price),
      remaining:
        d.remaining === null || d.remaining === undefined
          ? null
          : Number(d.remaining),
    }));
  
    const normalizedGifts = (vals.gift_options ?? []).map((g) => ({
      ...g,
      remaining:
        g.remaining === null || g.remaining === undefined
          ? null
          : Number(g.remaining),
    }));
  
    // 최종 DTO (id 병합)
    const payload: UpdateEventWithDiscountsAndGiftsDTO = {
      id: editId,
      ...vals,
      discounts: normalizedDiscounts,
      gift_options: normalizedGifts,
    };
  
    updateMutate.mutate(payload, {
      onSuccess: (_res) => {
        setEditOpen(false);
        // 필요 시 목록 리패치/토스트 등
        // qc.invalidateQueries({ queryKey: ["events", storeId] });
      },
      onError: (e: any) => {
        setUiError(e?.message ?? "이벤트 수정에 실패했습니다.");
      },
    });
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center gap-6">
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(`/profile/store-management/${storeId}`)
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-teal-700">이벤트 관리</h2>
        </div>
        <div className="flex items-center gap-3">
          {uiError && (
            <span className="text-sm text-red-600">{uiError}</span>
          )}
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            새 이벤트 등록
          </Button>
        </div>
      </div>

      {/* 목록 */}
      <div className="w-full max-w-5xl space-y-4">
        {listLoading && <p>로딩 중…</p>}

        {!listLoading && events.length === 0 && (
          <Card className="p-6 text-center">
            <CardHeader>
              <CardTitle className="text-lg font-bold">등록된 이벤트가 없습니다</CardTitle>
              <CardDescription className="text-gray-500">
                오른쪽 상단의 <span className="font-semibold">“새 이벤트 등록”</span>을 눌러 시작하세요.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!listLoading &&
          events.map((ev) => (
            <Card
              key={ev.id}
              className="p-5 flex items-center justify-between border-l-4 hover:shadow-md transition-all
              border-l-sky-500"
            >
              {/* 왼쪽 정보 */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{ev.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ev.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {ev.isActive ? "활성" : "비활성"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {ev.startDate} ~ {ev.endDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {(ev.weekdays ?? []).join(", ")}
                  </span>
                </div>
              </div>

              {/* 우측 액션 */}
              <Button variant="outline" onClick={() => openEdit(ev.id)}>
                <Pencil className="h-4 w-4 mr-1" />
                수정
              </Button>
            </Card>
          ))}
      </div>

    {/* 생성 다이얼로그 */}
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto p-0">
        {/* 스크롤 영역에 패딩/간격 관리 */}
        <div className="p-5 space-y-6">
          <DialogHeader className="pb-2">
            <DialogTitle>이벤트 생성</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmitCreate} className="space-y-6">
            <EventBasicFields form={createForm} />

            <SectionTitle title="할인 메뉴 (discounts)" />
            <DiscountArray
              form={createForm}
              fa={createDiscounts}
              menus={menus}
              menusLoading={menusLoading}
            />

            <SectionTitle title="증정 옵션 (gift_options)" />
            <GiftOptionArray
              form={createForm}
              fa={createGifts}
              menus={menus}
              menusLoading={menusLoading}
            />

            {/* 아래 여백 확보: sticky footer와 겹치지 않도록 */}
            <div className="h-4" />
          </form>
        </div>

        {/* 하단 고정(Sticky) Footer */}
        <DialogFooter className="sticky bottom-0 left-0 right-0 bg-white border-t p-4">
          <Button
            type="submit"
            onClick={() => onSubmitCreate()}
            className="bg-teal-600 text-white"
            disabled={createMutate.isPending}
          >
            {createMutate.isPending ? "생성 중…" : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 수정 다이얼로그 */}
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto p-0">
        <div className="p-5 space-y-6">
          <DialogHeader className="pb-2">
            <DialogTitle>이벤트 수정</DialogTitle>
          </DialogHeader>

          {detailLoading && <p className="px-1">상세 로딩 중…</p>}

          {!detailLoading && (
            <form
              id="edit-event-form"
              onSubmit={onSubmitUpdate}               // ← 여기 연결
              className="space-y-6"
            >
              <EventBasicFields form={editForm} />

              <SectionTitle title="할인 메뉴 (discounts)" />
              <DiscountArray
                form={editForm}
                fa={editDiscounts}
                menus={menus}
                menusLoading={menusLoading}
              />

              <SectionTitle title="증정 옵션 (gift_options)" />
              <GiftOptionArray
                form={editForm}
                fa={editGifts}
                menus={menus}
                menusLoading={menusLoading}
              />

              {/* sticky footer와 겹침 방지 */}
              <div className="h-4" />
            </form>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 left-0 right-0 bg-white border-t p-4">
          <Button
            type="submit"
            form="edit-event-form"                    // ← 폼 id 매핑
            className="bg-teal-600 text-white"
            disabled={detailLoading || updateMutate.isPending}
          >
            {updateMutate.isPending ? "저장 중…" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}

/* ===================== 하위 컴포넌트 ===================== */

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-lg font-semibold mt-2">{title}</h3>;
}

function EventBasicFields({
  form,
}: {
  form: UseFormReturn<CreateEventWithDiscountsAndGiftsDTO>;
}) {
  const weekdays = form.watch("weekdays") || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>이벤트 기본 정보</CardTitle>
        <CardDescription>기간/요일/해피아워/설명/활성여부</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>제목</Label>
          <Input {...form.register("title")} placeholder="이벤트 제목" />
        </div>

        <div>
          <Label>활성 여부</Label>
          <Select
            value={form.watch("is_active") ? "true" : "false"}
            onValueChange={(v) => form.setValue("is_active", v === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">활성</SelectItem>
              <SelectItem value="false">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>시작일</Label>
          <Input type="date" {...form.register("start_date", { valueAsDate: true })} />
        </div>
        <div>
          <Label>종료일</Label>
          <Input type="date" {...form.register("end_date", { valueAsDate: true })} />
        </div>

        <div>
          <Label>해피아워 시작(옵션)</Label>
          <Input type="time" step="1" {...form.register("happy_hour_start_time")} />
        </div>
        <div>
          <Label>해피아워 종료(옵션)</Label>
          <Input type="time" step="1" {...form.register("happy_hour_end_time")} />
        </div>

        <div className="md:col-span-2">
          <Label>요일</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {WEEKDAYS.map((wd) => {
              const checked = weekdays.includes(wd.value as any);
              return (
                <label key={wd.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const cur = new Set(form.getValues("weekdays"));
                      if (c) cur.add(wd.value);
                      else cur.delete(wd.value);
                      form.setValue("weekdays", Array.from(cur) as any, {
                        shouldDirty: true,
                      });
                    }}
                  />
                  {wd.label}
                </label>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>설명(옵션)</Label>
          <Input {...form.register("description")} placeholder="간단한 설명" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ===== discounts 전용 컴포넌트 ===== */
function DiscountArray({
  form,
  fa,
  menus,
  menusLoading,
}: {
  form: UseFormReturn<CreateEventWithDiscountsAndGiftsDTO>;
  fa: UseFieldArrayReturn<
    CreateEventWithDiscountsAndGiftsDTO,
    "discounts",
    "id"
  >;
  menus: StoreMenu[];
  menusLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {fa.fields.map((f, i) => (
          <div key={f.id} className="grid md:grid-cols-5 gap-3">
            <div>
              <Label>메뉴</Label>
              <MenuSelect
                value={form.watch(`discounts.${i}.menu_id`) as unknown as string}
                onChange={(id) =>
                  form.setValue(`discounts.${i}.menu_id`, id as any, {
                    shouldDirty: true,
                  })
                }
                menus={menus}
                disabled={menusLoading}
              />
            </div>
            <div>
              <Label>할인율(%)</Label>
              <Input
                type="number"
                {...form.register(`discounts.${i}.discount_rate`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div>
              <Label>최종가</Label>
              <Input
                type="number"
                {...form.register(`discounts.${i}.final_price`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div>
              <Label>남은 수량(옵션)</Label>
              <Input
                type="number"
                {...form.register(`discounts.${i}.remaining`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div>
              <Label>활성</Label>
              <Select
                value={String(form.watch(`discounts.${i}.is_active`) ?? true)}
                onValueChange={(v) =>
                  form.setValue(`discounts.${i}.is_active`, v === "true")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">활성</SelectItem>
                  <SelectItem value="false">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              fa.append({
                menu_id: "" as any,
                discount_rate: 10,
                final_price: 0,
                remaining: null,
                is_active: true,
              })
            }
          >
            + 할인 추가
          </Button>
          {fa.fields.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => fa.remove(fa.fields.length - 1)}
            >
              마지막 삭제
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ===== gift_options 전용 컴포넌트 ===== */
function GiftOptionArray({
  form,
  fa,
  menus,
  menusLoading,
}: {
  form: UseFormReturn<CreateEventWithDiscountsAndGiftsDTO>;
  fa: UseFieldArrayReturn<
    CreateEventWithDiscountsAndGiftsDTO,
    "gift_options",
    "id"
  >;
  menus: StoreMenu[];
  menusLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {fa.fields.map((f, i) => (
          <div key={f.id} className="grid md:grid-cols-4 gap-3">
            <div>
              <Label>메뉴</Label>
              <MenuSelect
                value={form.watch(`gift_options.${i}.menu_id`) as unknown as string}
                onChange={(id) =>
                  form.setValue(`gift_options.${i}.menu_id`, id as any, {
                    shouldDirty: true,
                  })
                }
                menus={menus}
                disabled={menusLoading}
              />
            </div>
            <div>
              <Label>남은 수량(옵션)</Label>
              <Input
                type="number"
                {...form.register(`gift_options.${i}.remaining`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div>
              <Label>활성</Label>
              <Select
                value={String(form.watch(`gift_options.${i}.is_active`) ?? true)}
                onValueChange={(v) =>
                  form.setValue(`gift_options.${i}.is_active`, v === "true")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">활성</SelectItem>
                  <SelectItem value="false">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="ghost" onClick={() => fa.remove(i)}>
                항목 삭제
              </Button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              fa.append({
                menu_id: "" as any,
                remaining: null,
                is_active: true,
              })
            }
          >
            + 증정 옵션 추가
          </Button>
          {fa.fields.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => fa.remove(fa.fields.length - 1)}
            >
              마지막 삭제
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}