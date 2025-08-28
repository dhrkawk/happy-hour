"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useGetMenusByStoreId,
  useCreateMenus,
  useUpdateMenu,
  useDeleteMenu,
} from "@/hooks/usecases/menus.usecase";

import {
  StoreMenuInsertSchema,
  StoreMenuInsertDTO,
  StoreMenuUpdateSchema,
  StoreMenuUpdateDTO,
} from "@/domain/schemas/schemas";

import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CategoryManagementDialog } from "@/components/category-management-dialog";

/** ✅ 배치 등록용 스키마: rows: StoreMenuInsertDTO[] (기존 스키마 재활용) */
const BulkInsertSchema = z.object({
  rows: z.array(StoreMenuInsertSchema),
});
type BulkInsertForm = z.infer<typeof BulkInsertSchema>; // { rows: StoreMenuInsertDTO[] }

export default function ManageMenusPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };

  // ----- local state -----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  // ----- react-query hooks -----
  const { data, isLoading } = useGetMenusByStoreId(storeId);
  const menus = Array.isArray(data) ? data : []; // ✅ JSX 밖에서 안전 처리
  const createMenus = useCreateMenus();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();

  // ----- categories (단일 소스, 중복/공백 제거, 안전 기본값) -----
  const categories = useMemo(() => {
    const set = new Set<string>();
    menus.forEach((m) => {
      const c = (m.category ?? "기타").trim();
      if (c) set.add(c);
    });
    return Array.from(set.size ? set : new Set(["기타"]));
  }, [menus]);

  // ----- price 정수 보정 helper -----
  const priceCast = {
    setValueAs: (v: any) => {
      if (v === "" || v === null || typeof v === "undefined") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : undefined;
    },
  };

  /* =========================
   * INSERT(배치) 폼: rows[] 사용
   * ========================= */
  const insertForm = useForm<BulkInsertForm>({
    resolver: zodResolver(BulkInsertSchema),
    defaultValues: {
      rows: [
        {
          store_id: storeId,
          name: "",
          price: 0,
          thumbnail: null,
          description: null,
          category: "기타",
        },
      ],
    },
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({
    control: insertForm.control,
    name: "rows",
  });

  /* =========================
   * UPDATE(단건) 폼
   * ========================= */
  const updateForm = useForm<StoreMenuUpdateDTO>({
    resolver: zodResolver(StoreMenuUpdateSchema),
    defaultValues: {
      name: "",
      price: 0,
      thumbnail: null,
      description: null,
      category: "기타",
    },
    mode: "onChange",
  });

  // ----- 다이얼로그 오픈 핸들러 -----
  const openCreateDialog = () => {
    setUiError(null);
    setIsNew(true);
    setEditId(null);
    insertForm.reset({
      rows: [
        {
          store_id: storeId,
          name: "",
          price: 0,
          thumbnail: null,
          description: null,
          category: "기타",
        },
      ],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (menu: {
    id: string;
    name: string;
    price: number;
    thumbnail: string | null;
    description: string | null;
    category: string | null;
  }) => {
    setUiError(null);
    setIsNew(false);
    setEditId(menu.id);
    updateForm.reset({
      name: menu.name,
      price: menu.price,
      thumbnail: menu.thumbnail,
      description: menu.description,
      category: menu.category ?? "기타",
    });
    setDialogOpen(true);
  };

  // ----- 삭제 -----
  const handleDelete = (id: string) => {
    setUiError(null);
    if (!id) {
      setUiError("삭제할 항목 id가 없습니다.");
      return;
    }
    if (!confirm("정말 삭제하시겠습니까?")) return;

    deleteMenu.mutate(
      { id, storeId },
      {
        onError: (e: any) => setUiError(e?.message ?? "삭제 중 오류가 발생했습니다."),
      }
    );
  };

  // ----- INSERT 제출(배치) -----
  const handleInsertSubmit = insertForm.handleSubmit((vals) => {
    setUiError(null);
    const payload: StoreMenuInsertDTO[] = vals.rows.map((r) => ({
      store_id: storeId, // 강제 일치
      name: r.name,
      price: Math.trunc(Number(r.price)),
      thumbnail: r.thumbnail === "" ? null : r.thumbnail ?? null,
      description: r.description === "" ? null : r.description ?? null,
      category: (r.category ?? "기타").trim() || "기타",
    }));
    createMenus.mutate(payload, {
      onSuccess: () => setDialogOpen(false),
      onError: (e: any) => setUiError(e?.message ?? "등록 중 오류가 발생했습니다."),
    });
  });

  // ----- UPDATE 제출(단건) -----
  const handleUpdateSubmit = updateForm.handleSubmit((v) => {
    setUiError(null);
    if (!editId) return;
    const dto: StoreMenuUpdateDTO = {
      name: String(v.name ?? "").trim(),
      price: Math.trunc(Number(v.price)),
      thumbnail: v.thumbnail === "" ? null : v.thumbnail ?? undefined,
      description: v.description === "" ? null : v.description ?? undefined,
      category: (v.category ?? "").toString().trim() || undefined,
    };
    updateMenu.mutate(
      { id: editId, storeId, dto },
      {
        onSuccess: () => setDialogOpen(false),
        onError: (e: any) => setUiError(e?.message ?? "수정 중 오류가 발생했습니다."),
      }
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
      {/* 헤더 */}
      <div className="w-full max-w-2xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/profile/store-management/${storeId}`)}
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-teal-600">메뉴 관리</h2>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            카테고리 관리
          </Button>
          <Button type="button" onClick={openCreateDialog}>+ 새 메뉴 등록</Button>
        </div>
      </div>

      {/* 오류 메세지 (상단) */}
      {uiError && <p className="text-red-600 text-sm">{uiError}</p>}

      {/* 메뉴 목록 */}
      <div className="w-full max-w-2xl space-y-4 pointer-events-auto">
        {isLoading && <p>로딩 중…</p>}

        {!isLoading &&
          categories.map((category) => {
            const items = menus.filter((m) => (m.category ?? "기타").trim() === category);

            return (
              <div key={`cat-${category}`} className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-700 mt-4">{category}</h3>

                {items.length === 0 && <p className="text-gray-500 text-sm">이 카테고리에 메뉴가 없습니다.</p>}

                {items.map((menu) => (
                  <Card key={menu.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-200 flex-shrink-0">
                        {menu.thumbnail && (
                          <img src={menu.thumbnail} alt={menu.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{menu.name}</p>
                        <p className="text-sm text-gray-500">{menu.price.toLocaleString()}원</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openEditDialog(menu)}
                        aria-label={`메뉴 수정 ${menu.name}`}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(menu.id)}
                        aria-label={`메뉴 삭제 ${menu.name}`}
                      >
                        삭제
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
      </div>

      {/* 등록/수정 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{isNew ? "메뉴 등록(여러 개)" : "메뉴 수정"}</DialogTitle>
            <CardDescription>
              {isNew ? "행을 추가하여 여러 메뉴를 한 번에 등록할 수 있습니다." : "메뉴 정보를 수정합니다."}
            </CardDescription>
          </DialogHeader>

          {isNew ? (
            /* ---------- INSERT(배치) ---------- */
            <form key="insert" onSubmit={handleInsertSubmit} className="space-y-5">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  가게 ID: <span className="font-mono">{storeId}</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    append({
                      store_id: storeId,
                      name: "",
                      price: 0,
                      thumbnail: null,
                      description: null,
                      category: "기타",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> 행 추가
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((f, i) => (
                  <Card key={f.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* name */}
                      <div>
                        <Label>메뉴명</Label>
                        <Input {...insertForm.register(`rows.${i}.name` as const)} placeholder="예: 아메리카노" />
                      </div>

                      {/* price */}
                      <div>
                        <Label>가격</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          {...insertForm.register(`rows.${i}.price` as const, priceCast)}
                          placeholder="예: 3500"
                        />
                      </div>

                      {/* category */}
                      <div>
                        <Label>카테고리</Label>
                        <Select
                          onValueChange={(value) =>
                            insertForm.setValue(`rows.${i}.category` as const, value, { shouldDirty: true })
                          }
                          value={insertForm.watch(`rows.${i}.category`) ?? "기타"}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={`opt-${i}-${c}`} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* thumbnail */}
                      <div>
                        <Label>썸네일 URL</Label>
                        <Input {...insertForm.register(`rows.${i}.thumbnail` as const)} placeholder="https://..." />
                      </div>

                      {/* remove row */}
                      <div className="flex items-end justify-end">
                        <Button type="button" variant="ghost" onClick={() => remove(i)}>
                          <Trash2 className="h-4 w-4 mr-1" /> 삭제
                        </Button>
                      </div>
                    </div>

                    {/* 숨김 필드: store_id, description(필요시 노출) */}
                    <input type="hidden" {...insertForm.register(`rows.${i}.store_id` as const)} value={storeId} />
                    {/* <div className="mt-2">
                      <Label>설명</Label>
                      <Input {...insertForm.register(`rows.${i}.description` as const)} placeholder="설명" />
                    </div> */}
                  </Card>
                ))}
              </div>

              <DialogFooter className="flex justify-end pt-2">
                <Button type="submit" className="bg-teal-600 text-white" disabled={createMenus.isPending}>
                  {createMenus.isPending ? "등록 중…" : "일괄 등록"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* ---------- UPDATE(단건) ---------- */
            <form key="update" onSubmit={handleUpdateSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">메뉴명</Label>
                <Input id="name" {...updateForm.register("name")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">메뉴 가격</Label>
                <Input id="price" type="number" inputMode="numeric" {...updateForm.register("price", priceCast)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">메뉴 카테고리</Label>
                <Select
                  onValueChange={(value) => updateForm.setValue("category", value, { shouldDirty: true })}
                  value={updateForm.watch("category") ?? "기타"}
                >
                  <SelectTrigger className="w-full" id="category">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={`upd-opt-${c}`} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="flex justify-end pt-4">
                <Button type="submit" className="bg-teal-600 text-white" disabled={updateMenu.isPending}>
                  {updateMenu.isPending ? "저장 중…" : "수정 저장"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 카테고리 관리 Dialog */}
      <CategoryManagementDialog
        isOpen={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        storeId={storeId}
      />
    </div>
  );
}