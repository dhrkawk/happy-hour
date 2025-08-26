import { StoreListItemVM } from "../store.vm";
  
type SortOrder = 'asc' | 'desc';


// ==============================
// Helper predicates & comparators
// ==============================
const hasDiscount = (vm: StoreListItemVM, min = 0) =>
vm.maxDiscountRate !== null && Number.isFinite(vm.maxDiscountRate) && (vm.maxDiscountRate as number) > min;

const hasPartnership = (vm: StoreListItemVM) =>
!!vm.partershipText && vm.partershipText.trim().length > 0;

const safeDiscount = (vm: StoreListItemVM) =>
vm.maxDiscountRate ?? -Infinity;

const safeDistance = (vm: StoreListItemVM) =>
Number.isFinite(vm.distance) ? vm.distance : Infinity;

// 안정적 정렬을 위해 index 유지
function stableSort<T>(arr: readonly T[], cmp: (a: T, b: T) => number): T[] {
return arr
    .map((v, i) => ({ v, i }))
    .sort((a, b) => {
    const c = cmp(a.v, b.v);
    return c !== 0 ? c : a.i - b.i;
    })
    .map(x => x.v);
}
  
  
// ==============================
// Standalone 유틸 함수
// ==============================

// 1) 할인만 필터 (옵션: 최소 할인율 기준)
export function filterDiscountOnly(list: readonly StoreListItemVM[], minDiscount = 0): StoreListItemVM[] {
return list.filter(vm => hasDiscount(vm, minDiscount));
}

// 2) 제휴만 필터
export function filterPartnershipOnly(list: readonly StoreListItemVM[]): StoreListItemVM[] {
return list.filter(hasPartnership);
}

// 3) 할인율 내림차순 정렬 (tie-breaker: hasEvent=true 우선, 이후 이름)
export function sortByDiscountDesc(list: readonly StoreListItemVM[]): StoreListItemVM[] {
return stableSort(list, (a, b) => {
    const d = safeDiscount(b) - safeDiscount(a);
    if (d !== 0) return d;
    if (a.hasEvent !== b.hasEvent) return a.hasEvent ? -1 : 1;
    return a.name.localeCompare(b.name);
});
}

// 4) 거리 오름차순 정렬 (미측정/NaN/Infinity는 뒤로)
export function sortByDistanceAsc(list: readonly StoreListItemVM[]): StoreListItemVM[] {
return stableSort(list, (a, b) => {
    const da = safeDistance(a);
    const db = safeDistance(b);
    if (da === db) return a.name.localeCompare(b.name);
    return da - db;
});
}

// 5) 이름 정렬 (오름/내림)
export function sortByName(list: readonly StoreListItemVM[], order: SortOrder = 'asc'): StoreListItemVM[] {
return stableSort(list, (a, b) => {
    const c = a.name.localeCompare(b.name);
    return order === 'asc' ? c : -c;
});
}