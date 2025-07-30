export interface DiscountFormViewModel {
  discount_rate: number;
  quantity: number | null;
  start_time: string;
  end_time: string;
}

export interface DiscountListItemViewModel {
  id: string;
  discount_rate: number;
  quantity: number | null;
  start_time: string;
  end_time: string;
  menuName: string;
  storeName: string;
}
