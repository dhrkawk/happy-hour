// frontend/lib/types/index.ts
import { Database } from './database.types';

export type ReservationDetails =
  Database['public']['Tables']['reservations']['Row'] & {
    stores: Database['public']['Tables']['stores']['Row'];
    reservation_items: (Database['public']['Tables']['reservation_items']['Row'] & {
      store_menus: Database['public']['Tables']['store_menus']['Row'];
      discounts: Database['public']['Tables']['discounts']['Row'] | null;
    })[];
  };