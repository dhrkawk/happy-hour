// helpers/price.ts
export function applyDiscountsToMenus(
    menus: { id: string; name: string; originalPrice: number; thumbnail: string|null; description: string|null; category: string|null; }[],
    discounts: { menuId: string; discountRate: number; finalPrice: number; isActive: boolean }[] | undefined
  ) {
    const dmap = new Map<string, { rate: number; final: number }>();
    for (const d of discounts ?? []) {
      // 메뉴별 최대 할인률(or 최저 최종가) 등 정책이 있다면 여기서 집계
      const prev = dmap.get(d.menuId);
      if (!prev || d.discountRate > prev.rate) dmap.set(d.menuId, { rate: d.discountRate, final: d.finalPrice });
    }
  
    return menus.map(m => {
      const d = dmap.get(m.id);
      if (!d) {
        return { ...m, discountRate: 0, discountPrice: m.originalPrice };
      }
      return { ...m, discountRate: d.rate, discountPrice: d.final };
    });
  }