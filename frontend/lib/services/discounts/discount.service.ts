import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { DiscountEntity } from '@/lib/entities/discounts/discount.entity';
import { DiscountFormViewModel, DiscountViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';

export class DiscountService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async registerDiscount(discountData: DiscountFormViewModel, storeId: string): Promise<DiscountEntity> {
    const { data, error } = await this.supabase
      .from('discounts')
      .insert({
        store_id: storeId,
        menu_id: discountData.menu_id,
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

  async getDiscountsByStoreId(storeId: string): Promise<DiscountViewModel[]> {
    const { data, error } = await this.supabase
      .from('discounts')
      .select('*, menu:store_menus(name)') // Join with store_menus to get menu name
      .eq('store_id', storeId);

    if (error) throw new Error(`Failed to fetch discounts: ${error.message}`);

    return data.map(discount => ({
      id: discount.id,
      name: discount.menu ? discount.menu.name : 'Unknown Menu',
      description: `Discount on ${discount.menu ? discount.menu.name : 'Unknown Menu'}`,
      discountType: 'percentage',
      value: discount.discount_rate,
      startDate: discount.start_time,
      endDate: discount.end_time,
    })) as DiscountViewModel[];
  }

  async getDiscountById(discountId: string): Promise<DiscountEntity | null> {
    const { data, error } = await this.supabase
      .from('discounts')
      .select('*')
      .eq('id', discountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to fetch discount: ${error.message}`);
    }
    return data as DiscountEntity;
  }

  async updateDiscount(discountId: string, discountData: Partial<DiscountFormViewModel>): Promise<DiscountEntity> {
    const { data, error } = await this.supabase
      .from('discounts')
      .update({
        discount_rate: discountData.discount_rate,
        quantity: discountData.quantity,
        start_time: discountData.start_time,
        end_time: discountData.end_time,
        menu_id: discountData.menu_id, // Allow updating menu_id
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
