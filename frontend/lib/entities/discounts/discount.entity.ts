export interface DiscountEntity {
  id: string;
  store_id: string;
  menu_id: string;
  discount_rate: number;
  start_time: string;
  end_time: string;
  quantity: number | null;
  created_at: string;
}
