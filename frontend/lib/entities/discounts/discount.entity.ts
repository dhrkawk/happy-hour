export interface DiscountEntity {
  id: string;
  menu_id: string;
  discount_rate: number;
  final_price: number;
  quantity: number | null;
  created_at: string;
  is_active: boolean;
}
