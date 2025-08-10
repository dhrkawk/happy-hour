"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { MenuApiClient } from "@/lib/services/menus/menu.api-client";
import { MenuListItemViewModel } from "@/lib/viewmodels/menus/menu.viewmodel";
import { Gift, Calendar, Clock, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";

// === Types ===
type GiftRecord = {
  id: string;
  store_id: string;
  option_menu_ids: string[];      // uuid[] in DB
  gift_qty: number;
  start_at: string;               // ISO
  end_at: string;                 // ISO
  is_active: boolean;
  max_redemptions: number | null;
  remaining: number | null;
  display_note: string | null;
  created_at: string;
};

type GiftForm = {
  optionMenuIds: string[];
  giftQty: number;
  startAt: string;      // for <input type="datetime-local">
  endAt: string;        // for <input type="datetime-local">
  isActive: boolean;
  maxRedemptions?: number | null;
  remaining?: number | null;
  displayNote?: string;
};

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  // yyyy-MM-ddThh:mm (no seconds)
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function toISOFromLocalInput(local: string) {
  // treat local datetime as local timezone and convert to ISO
  return local ? new Date(local).toISOString() : "";
}

export default function ManageGiftsPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };
  const supabase = createClient();
  const menuApiClient = new MenuApiClient(storeId);

  const [menus, setMenus] = useState<MenuListItemViewModel[]>([]);
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [selectedGift, setSelectedGift] = useState<GiftRecord | null>(null);
  const [form, setForm] = useState<GiftForm>({
    optionMenuIds: [],
    giftQty: 1,
    startAt: "",
    endAt: "",
    isActive: true,
    maxRedemptions: null,
    remaining: null,
    displayNote: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Menu map for quick lookup
  const menuMap = useMemo(() => {
    const map = new Map<string, MenuListItemViewModel>();
    menus.forEach(m => map.set(m.id, m));
    return map;
  }, [menus]);

  const loadMenus = async () => {
    const list = await menuApiClient.getMenus();
    setMenus(list || []);
  };

  const loadGifts = async () => {
    const { data, error } = await supabase
      .from("store_gifts")
      .select("*")
      .eq("store_id", storeId)
      .order("start_at", { ascending: false });

    if (error) throw error;
    setGifts((data as GiftRecord[]) || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadMenus(), loadGifts()]);
      } catch (err: any) {
        setError(err.message || "데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openCreateDialog = () => {
    setIsNew(true);
    setSelectedGift(null);
    setForm({
      optionMenuIds: [],
      giftQty: 1,
      startAt: "",
      endAt: "",
      isActive: true,
      maxRedemptions: null,
      remaining: null,
      displayNote: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (gift: GiftRecord) => {
    setIsNew(false);
    setSelectedGift(gift);
    setForm({
      optionMenuIds: gift.option_menu_ids || [],
      giftQty: gift.gift_qty,
      startAt: toLocalInputValue(gift.start_at),
      endAt: toLocalInputValue(gift.end_at),
      isActive: !!gift.is_active,
      maxRedemptions: gift.max_redemptions ?? null,
      remaining: gift.remaining ?? null,
      displayNote: gift.display_note ?? "",
    });
    setDialogOpen(true);
  };

  const toggleOption = (menuId: string) => {
    setForm(prev => {
      const set = new Set(prev.optionMenuIds);
      if (set.has(menuId)) set.delete(menuId);
      else set.add(menuId);
      return { ...prev, optionMenuIds: Array.from(set) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validations
    if (form.optionMenuIds.length === 0) {
      setError("증정 옵션으로 제공할 메뉴를 1개 이상 선택해주세요.");
      setLoading(false);
      return;
    }
    if (!form.startAt || !form.endAt) {
      setError("시작/종료 일시를 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        store_id: storeId,
        option_menu_ids: form.optionMenuIds,
        gift_qty: Number(form.giftQty) || 1,
        start_at: toISOFromLocalInput(form.startAt),
        end_at: toISOFromLocalInput(form.endAt),
        is_active: !!form.isActive,
        max_redemptions: form.maxRedemptions ?? null,
        remaining: form.remaining ?? null,
        display_note: form.displayNote ?? null,
      };

      if (isNew) {
        const { error } = await supabase.from("store_gifts").insert(payload);
        if (error) throw error;
      } else if (selectedGift) {
        const { error } = await supabase
          .from("store_gifts")
          .update(payload)
          .eq("id", selectedGift.id);
        if (error) throw error;
      }

      await loadGifts();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (giftId: string) => {
    if (!confirm("정말로 이 증정 규칙을 삭제하시겠습니까?")) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.from("store_gifts").delete().eq("id", giftId);
      if (error) throw error;
      await loadGifts();
    } catch (err: any) {
      setError(err.message || "삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
      <div className="w-full max-w-2xl flex justify-between items-center">
        <h2 className="text-2xl font-bold text-teal-600">증정품 관리</h2>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog}>+ 새 증정 등록</Button>
        </div>
      </div>

      {error && (
        <div className="w-full max-w-2xl text-red-600 text-sm">{error}</div>
      )}

      <div className="w-full max-w-2xl space-y-4">
        {gifts.length === 0 && !loading && (
          <Card className="p-6">
            <p className="text-gray-600">등록된 증정 규칙이 없습니다. “새 증정 등록”을 눌러 추가하세요.</p>
          </Card>
        )}

        {gifts.map((gift) => {
          const optionNames = (gift.option_menu_ids || [])
            .map(id => menuMap.get(id)?.name)
            .filter(Boolean)
            .join(", ");

          const active = gift.is_active && new Date(gift.start_at) <= new Date() && new Date() < new Date(gift.end_at);

          return (
            <Card key={gift.id} className="p-4 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                  <Gift className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">증정 옵션</p>
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle2 className="w-4 h-4" /> 활성
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
                        <XCircle className="w-4 h-4" /> 비활성
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {optionNames || "(선택된 메뉴명을 불러오는 중)"}
                    {gift.gift_qty > 1 ? ` × ${gift.gift_qty}` : ""}
                  </p>
                  {gift.display_note && (
                    <p className="text-xs text-gray-500 mt-1">{gift.display_note}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(gift.start_at).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      ~ {new Date(gift.end_at).toLocaleString()}
                    </span>
                    {(gift.max_redemptions ?? null) !== null && (
                      <span>한도 {gift.max_redemptions} / 남은 {gift.remaining ?? 0}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(gift)}>
                  <Edit className="w-4 h-4 mr-1" /> 수정
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(gift.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> 삭제
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{isNew ? "증정 등록" : "증정 수정"}</DialogTitle>
            <CardDescription>
              {isNew ? "증정 옵션과 기간을 설정하세요." : "증정 정보를 수정합니다."}
            </CardDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 옵션 선택 */}
            <div className="space-y-2">
              <Label>증정 옵션 메뉴(여러 개 선택 시 ‘택1’로 노출됩니다)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-auto border rounded-md p-2 bg-gray-50">
                {menus.map(m => (
                  <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={form.optionMenuIds.includes(m.id)}
                      onChange={() => toggleOption(m.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-800">{m.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{m.price.toLocaleString()}원</span>
                  </label>
                ))}
                {menus.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-2">등록된 메뉴가 없습니다. 먼저 메뉴를 추가하세요.</p>
                )}
              </div>
            </div>

            {/* 수량 */}
            <div className="space-y-2">
              <Label htmlFor="giftQty">증정 수량</Label>
              <Input
                id="giftQty"
                type="number"
                min={1}
                value={form.giftQty}
                onChange={(e) => setForm(f => ({ ...f, giftQty: Number(e.target.value) || 1 }))}
              />
            </div>

            {/* 기간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">시작 일시</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm(f => ({ ...f, startAt: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">종료 일시</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm(f => ({ ...f, endAt: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* 활성/한도/남은/노트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isActive">활성화</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">{form.isActive ? "활성" : "비활성"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRedemptions">전체 한도(선택)</Label>
                <Input
                  id="maxRedemptions"
                  type="number"
                  min={0}
                  placeholder="예: 100"
                  value={form.maxRedemptions ?? ""}
                  onChange={(e) =>
                    setForm(f => ({ ...f, maxRedemptions: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remaining">남은 수량(선택)</Label>
                <Input
                  id="remaining"
                  type="number"
                  min={0}
                  placeholder="예: 100"
                  value={form.remaining ?? ""}
                  onChange={(e) =>
                    setForm(f => ({ ...f, remaining: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayNote">표시 문구(선택)</Label>
                <Input
                  id="displayNote"
                  placeholder="예: '사이드/음료 중 택1 증정'"
                  value={form.displayNote ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, displayNote: e.target.value }))}
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}

            <DialogFooter className="flex justify-end pt-4">
              <Button type="submit" className="bg-teal-600 text-white">
                {loading ? "처리 중..." : isNew ? "등록 완료" : "수정 저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}