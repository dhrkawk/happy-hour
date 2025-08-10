import { DiscountEntity } from "@/lib/entities/discounts/discount.entity";
import { getDiscountStatus } from "@/lib/utils";
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
  status: "scheduled" | "active" | "expired";
}

export function createDiscountDetailViewModel(entity: DiscountEntity): DiscountDetailViewModel {
  return {
    id: entity.id,
    menu_id: entity.menu_id,
    discount_rate: entity.discount_rate,
    start_time: entity.start_time,
    end_time: entity.end_time,
    quantity: entity.quantity,
    created_at: entity.created_at,
    status: getDiscountStatus(entity.start_time, entity.end_time, entity.is_active),
  };
}

export function createDiscountFormViewModel(menu_id: string): DiscountFormViewModel {
  return {
    menu_id,
    discount_rate: 0,
    quantity: null,
    start_time: "",
    end_time: "",
  };
}