import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { DiscountEntity } from '@/lib/entities/discounts/discount.entity';
import { DiscountFormViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';

export class DiscountService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async registerDiscount(discountData: DiscountFormViewModel, storeId: string, menuId: string): Promise<DiscountEntity> {
    const { data, error } = await this.supabase
      .from('discounts')
      .insert({
        store_id: storeId,
        menu_id: menuId,
        discount_rate: discountData.discount_rate,
        start_time: discountData.start_time,
        end_time: discountData.end_time,
        quantity: discountData.quantity || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to register discount: ${error.message}`);
    return data as DiscountEntity;
  }

  async getDiscountsByMenuId(menuId: string): Promise<DiscountEntity[]> {
    const { data, error } = await this.supabase
      .from('discounts')
      .select('*')
      .eq('menu_id', menuId);

    if (error) throw new Error(`Failed to fetch discounts: ${error.message}`);
    return data as DiscountEntity[];
  }

  async updateDiscount(discountId: string, discountData: Partial<DiscountFormViewModel>): Promise<DiscountEntity> {
    const { data, error } = await this.supabase
      .from('discounts')
      .update({
        discount_rate: discountData.discount_rate,
        quantity: discountData.quantity,
        start_time: discountData.start_time,
        end_time: discountData.end_time,
      })
      .eq('id', discountId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update discount: ${error.message}`);
    return data as DiscountEntity;
  }

  async deleteDiscount(discountId: string): Promise<void> {
    const { error } = await this.supabase
      .from('discounts')
      .delete()
      .eq('id', discountId);

    if (error) throw new Error(`Failed to delete discount: ${error.message}`);
  }
}
