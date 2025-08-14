import { useState, useMemo } from "react";
import { StoreCardViewModel } from "@/lib/viewmodels/store-card.viewmodel";

/**
 * 가게 목록을 받아 필터링 및 정렬 로직을 적용하는 커스텀 훅
 * @param allStores 필터링/정렬을 적용할 원본 가게 ViewModels 배열
 */
export function useFilteredStores(allStores: StoreCardViewModel[]) {
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [selectedSorting, setSelectedSorting] = useState<"거리순" | "할인순" | "할인만" | "제휴만">("할인순");

  const finalViewModels = useMemo(() => {
    // 1. 카테고리 필터링
    const categoryFiltered = StoreCardViewModel.filterByCategory(allStores, selectedCategory);

    // 2. 정렬
    if (selectedSorting === "거리순") {
      return StoreCardViewModel.sortByDistance(categoryFiltered);
    } else if (selectedSorting === "할인만") {
      return StoreCardViewModel.filterByDiscount(categoryFiltered);
    } else if (selectedSorting === "제휴만") {
      return StoreCardViewModel.filterByPartnership(categoryFiltered);
    }
    // 기본값은 할인순
    return StoreCardViewModel.sortByDiscount(categoryFiltered);
    
  }, [selectedCategory, selectedSorting, allStores]);

  return {
    finalViewModels,
    selectedCategory,
    setSelectedCategory,
    selectedSorting,
    setSelectedSorting,
  };
}