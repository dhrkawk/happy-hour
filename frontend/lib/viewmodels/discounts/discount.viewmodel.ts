export interface DiscountFormViewModel {
  discount_rate: number;
  quantity: number | null;
  start_time: string;
  end_time: string;
  menu_id: string;
}

export interface DiscountViewModel {
  id: string;
  name: string;
  description: string;
  discountType: string;
  value: number;
  startDate: string;
  endDate: string;
}

export interface DiscountListItemViewModel {
  id: string;
  name: string;
  description: string;
  discountType: string;
  value: number;
  startDate: string;
  endDate: string;
  menuName?: string;
}

export interface DiscountDetailViewModel {
  id: string;
  menu_id: string;
  discount_rate: number;
  start_time: string;
  end_time: string;
  quantity: number | null;
  created_at: string;
}
