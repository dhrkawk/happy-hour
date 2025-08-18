export interface EventFormViewModel {
  eventData: {
    store_id: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    happyhour_start_time: string; // HH:mm:ss
    happyhour_end_time: string;   // HH:mm:ss
    weekdays: string[]; // ['mon', 'tue', ...]
    is_active?: boolean;
    description?: string;
    max_discount_rate?: number;
    title: string;
    max_final_price?: number;
    max_original_price?: number;
  };
  discounts: {
    discount_rate: number;
    quantity: number;
    menu_id: string;
    final_price: number;
    is_active?: boolean;
  }[];
  gifts: {
    gift_qty?: number;
    start_at: string; // ISO format timestamp (e.g. '2025-08-17T15:00:00+09:00')
    end_at: string;   // ISO format timestamp
    is_active?: boolean;
    max_redemptions?: number;
    remaining?: number;
    display_note?: string;
    option_menu_ids: string[]; // UUID[]
  }[];
}