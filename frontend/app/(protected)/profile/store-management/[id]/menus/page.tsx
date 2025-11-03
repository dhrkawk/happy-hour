"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";

import {
  useGetMenusByStoreId,
  useCreateMenus,
  useUpdateMenu,
  useDeleteMenu,
  uploadStoreMenuThumbnail,
} from "@/hooks/usecases/menus.usecase";

import { StoreMenu } from "@/domain/entities/entities";
import {
  StoreMenuInsertSchema,
  StoreMenuInsertDTO,
  StoreMenuUpdateSchema,
  StoreMenuUpdateDTO,
} from "@/domain/schemas/schemas";

import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/confirm-dialog";
import { Card, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryManagementDialog } from "@/components/category-management-dialog";

/** ✅ 배치 등록용 스키마 */
const BulkInsertSchema = z.object({
  rows: z.array(StoreMenuInsertSchema),
});
type BulkInsertForm = z.infer<typeof BulkInsertSchema>;

/* ---------------- ThumbnailDropzone (행별 자식 컴포넌트) ---------------- */
function ThumbnailDropzone({
  storeId,
  value,
  onUploaded,
  className = "",
}: {
  storeId: string;
  value: string | null;
  onUploaded: (url: string) => void;
  className?: string;
}) {
  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      const url = await uploadStoreMenuThumbnail(storeId, file);
      onUploaded(url);
    },
    [storeId, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        "border-2 border-dashed rounded-md p-3 text-center cursor-pointer",
        isDragActive ? "border-teal-500 bg-teal-50" : "border-gray-300",
        className,
      ].join(" ")}
    >
      <input {...getInputProps()} />
      {value ? (
        <img src={value} alt="thumbnail preview" className="mx-auto h-20 object-cover" />
      ) : (
        <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
          <Upload className="h-4 w-4" />
          파일을 드래그하거나 클릭해서 업로드
        </p>
      )}
    </div>
  );
}

/* ======================= 메인 페이지 ======================= */
export default function ManageMenusPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };

  // ----- local state -----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // ----- react-query hooks -----
  const { data, isLoading, refetch } = useGetMenusByStoreId(storeId);
  const createMenus = useCreateMenus();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();

  // ----- data processing -----
  const menus: StoreMenu[] = useMemo(() => (data?.menus ?? []).map(StoreMenu.fromRow), [data?.menus]);
  const officialCategories = useMemo(() => data?.categories ?? [], [data?.categories]);

  // ----- categories (official + inferred) -----
  const categories = useMemo(() => {
    const combined = new Set(officialCategories);
    menus.forEach((m) => {
      const c = (m.category ?? "기타").trim();
      if (c) combined.add(c);
    });
    return Array.from(combined.size ? combined : new Set(["기타"]));
  }, [officialCategories, menus]);

  // ----- price 정수 보정 helper -----
  const priceCast = {
    setValueAs: (v: any) => {
      if (v === "" || v === null || typeof v === "undefined") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : undefined;
    },
  };

  /* =========================
   * INSERT(배치) 폼
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

  // ----- 다이얼로그 오픈 -----
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

  const openEditDialog = (menu: any) => {
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
      store_id: storeId,
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

  // ----- UPDATE 제출 -----
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
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push(`/profile/store-management/${storeId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-teal-600">메뉴 관리</h2>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(true)}>카테고리 관리</Button>
          <Button type="button" onClick={openCreateDialog}>+ 새 메뉴 등록</Button>
        </div>
      </div>

      {uiError && <p className="text-red-600 text-sm">{uiError}</p>}

      {/* 메뉴 목록 */}
      <div className="w-full max-w-2xl space-y-4">
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
                        {menu.thumbnail && <img src={menu.thumbnail} alt={menu.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{menu.name}</p>
                        <p className="text-sm text-gray-500">{menu.price.toLocaleString()}원</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={() => openEditDialog(menu)}>수정</Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => { setPendingDeleteId(menu.id); setConfirmOpen(true)}}>삭제</Button>
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
            <DialogDescription>{isNew ? "Drag & Drop으로 썸네일 업로드 가능" : "메뉴 정보를 수정합니다."}</DialogDescription>
          </DialogHeader>

          {isNew ? (
            <form onSubmit={handleInsertSubmit} className="space-y-4">
              <div className="max-h-[60vh] overflow-y-auto space-y-4 p-1">
                {fields.map((f, i) => (
                  <Card key={f.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <Label>메뉴명</Label>
                        <Input {...insertForm.register(`rows.${i}.name`)} />
                      </div>
                      <div>
                        <Label>가격</Label>
                        <Input type="number" {...insertForm.register(`rows.${i}.price`, priceCast)} />
                      </div>
                      <div>
                        <Label>카테고리</Label>
                        <Select
                          onValueChange={(value) => insertForm.setValue(`rows.${i}.category`, value, { shouldDirty: true })}
                          value={insertForm.watch(`rows.${i}.category`) ?? "기타"}
                        >
                          <SelectTrigger><SelectValue placeholder="카테고리" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={`opt-${f.id}-${c}`} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>썸네일</Label>
                        <ThumbnailDropzone
                          storeId={storeId}
                          value={insertForm.watch(`rows.${i}.thumbnail`) as string | null}
                          onUploaded={(url) =>
                            insertForm.setValue(`rows.${i}.thumbnail`, url, { shouldDirty: true })
                          }
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button type="button" variant="ghost" onClick={() => remove(i)}>
                          <Trash2 className="h-4 w-4 mr-1" /> 삭제
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <DialogFooter className="gap-2 pt-4">
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
                <Button type="submit" className="bg-teal-600 text-white">
                  일괄 등록
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div><Label>메뉴명</Label><Input {...updateForm.register("name")} /></div>
              <div><Label>가격</Label><Input type="number" {...updateForm.register("price", priceCast)} /></div>
              <div>
                <Label>카테고리</Label>
                <Select
                  onValueChange={(value) => updateForm.setValue("category", value)}
                  value={updateForm.watch("category") ?? "기타"}
                >
                  <SelectTrigger><SelectValue placeholder="카테고리" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={`upd-${c}`} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-teal-600 text-white">수정 저장</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="메뉴 삭제"
        message="정말로 이 메뉴를 삭제하시겠습니까?"
        confirmText="삭제하기"
        cancelText="취소"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          setConfirmOpen(false);
          deleteMenu.mutate(
            { id: pendingDeleteId, storeId },
            {
              onSettled: () => setPendingDeleteId(null),
              onError: (e: any) => setUiError(e?.message ?? "삭제 중 오류가 발생했습니다."),
            }
          );
        }}
      />

      <CategoryManagementDialog
        isOpen={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        storeId={storeId}
        onUpdate={refetch}
      />
    </div>
  );
}
