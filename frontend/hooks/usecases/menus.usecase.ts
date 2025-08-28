import { jsonFetch, jsonPost } from "./json-helper";
import { StoreMenuInsertDTO,StoreMenuUpdateDTO } from "@/domain/schemas/schemas";
import { StoreMenu } from "@/domain/entities/entities";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

/* =============== Query Keys =============== */
const qk = {
    menusByStore: (storeId?: string) => ["menus","by-store",storeId] as const,
  };

/* =============== Usecases =============== */

/** GET /api/menus?storeId=... -> StoreMenu[] */

export function useGetMenusByStoreId(storeId?: string, enabled = true) {
    return useQuery({
      queryKey: qk.menusByStore(storeId),
      enabled: !!storeId && enabled,
      // 서버는 { menus }를 주지만, select로 클라에선 StoreMenu[]만 받도록 변환
      queryFn: async () =>
        jsonFetch<{ menus: any[] }>(`/api/menus?storeId=${encodeURIComponent(storeId!)}`),
      select: (res): StoreMenu[] => (res.menus ?? []).map(StoreMenu.fromRow),
      // 필요 시 캐시 정책
      // staleTime: 60_000,
    });
  }

/** POST /api/menus (bulk insert) */
export function useCreateMenus() {
  const qc = useQueryClient();

  return useMutation({
    // 1) 빈 배열 방지
    mutationFn: async (rows: StoreMenuInsertDTO[]) => {
      if (!rows?.length) throw new Error("rows is empty");
      return jsonPost<{ created: number }>(`/api/menus`, rows);
    },

    // 2) 성공 시 캐시 무효화 (정석)
    onSuccess: (_data, rows) => {
      const sid = rows[0]?.store_id;
      if (sid) qc.invalidateQueries({ queryKey: qk.menusByStore(sid) });
      else qc.invalidateQueries({ queryKey: ["menus"] });
    },

    // 4) 정리
    // onSettled: (_d, _e, rows) => { /* 필요 시 로깅 */ },
  });
}

// (선택) 캐시 내 리스트에서 항목을 교체/제거하기 위한 헬퍼
function replaceMenuInCache(
    list: StoreMenu[] | undefined,
    updated: Partial<StoreMenu> & { id: string }
  ) {
    if (!Array.isArray(list)) return list ?? []; // 안전 가드
    return list.map((m) =>
      m.id === updated.id ? { ...m, ...updated } as StoreMenu : m
    );
  }
function removeMenuInCache(list: StoreMenu[] | undefined, id: string) {
  if (!Array.isArray(list)) return list ?? []; // 안전 가드
  return list.filter(m => m.id !== id);
}

/* =========================
 * API functions
 * ========================= */
async function apiUpdateMenu(id: string, dto: StoreMenuUpdateDTO): Promise<{ ok: true }> {
    console.log("apiUpdateMenu", id, dto);
  const res = await fetch(`/api/menus/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j?.error ?? j?.message ?? `Request failed (${res.status})`);
    } catch {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed (${res.status})`);
    }
  }
  return res.json() as Promise<{ ok: true }>;
}

async function apiDeleteMenu(id: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/menus/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j?.error ?? j?.message ?? `Request failed (${res.status})`);
    } catch {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed (${res.status})`);
    }
  }
  return res.json() as Promise<{ ok: true }>;
}

/* =========================
 * Usecases (React Query Hooks)
 * ========================= */

/** PATCH /api/menus/:id */
export function useUpdateMenu() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { id: string; dto: StoreMenuUpdateDTO; storeId: string }) => {
        if (!vars?.id) throw new Error('id is required');
        const res = await apiUpdateMenu(vars.id, vars.dto);
        return res;
      },

    // 낙관적 업데이트 (옵션)
    onMutate: async ({ id, dto, storeId }) => {
        try {
          await qc.cancelQueries({ queryKey: qk.menusByStore(storeId) });
          const prev = qc.getQueryData<StoreMenu[]>(qk.menusByStore(storeId));
  
          // 안전 가드: 절대 throw 금지
          qc.setQueryData<StoreMenu[]>(qk.menusByStore(storeId), (old) =>
            replaceMenuInCache(old, {
              id,
              name: (dto as any).name,
              price: (dto as any).price,
              thumbnail: (dto as any).thumbnail,
              description: (dto as any).description,
              category: (dto as any).category,
            })
          );
          return { prev, storeId };
        } catch (e) {
          return { prev: undefined, storeId };
        }
      },

    onError: (_err, { storeId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.menusByStore(storeId), ctx.prev);
    },

    // 최종적으로 서버 데이터로 동기화
    onSuccess: (_data, { storeId }) => {
      qc.invalidateQueries({ queryKey: qk.menusByStore(storeId) });
    },
  });
}

/** DELETE /api/menus/:id */
export function useDeleteMenu() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { id: string; storeId: string }) => {
      if (!vars?.id) throw new Error("id is required");
      return apiDeleteMenu(vars.id);
    },

    // 낙관적 삭제 (옵션)
    onMutate: async ({ id, storeId }) => {
      await qc.cancelQueries({ queryKey: qk.menusByStore(storeId) });
      const prev = qc.getQueryData<StoreMenu[]>(qk.menusByStore(storeId));
      qc.setQueryData<StoreMenu[]>(qk.menusByStore(storeId), old => removeMenuInCache(old, id));
      return { prev, storeId };
    },

    onError: (_err, { storeId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.menusByStore(storeId), ctx.prev);
    },

    // 안전하게 서버 상태로 동기화
    onSuccess: (_data, { storeId }) => {
      qc.invalidateQueries({ queryKey: qk.menusByStore(storeId) });
    },
  });
}