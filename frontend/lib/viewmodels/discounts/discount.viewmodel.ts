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
