import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { DiscountEntity } from '@/lib/entities/discounts/discount.entity';
import { DiscountFormViewModel, DiscountViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';

export class DiscountService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  private async _checkForOverlappingDiscounts(
    menuId: string,
    startTime: string,
    endTime: string,
    excludeDiscountId?: string
  ): Promise<void> {
    const query = this.supabase
      .from('discounts')
      .select('id')
      .eq('menu_id', menuId)
      // Check for time overlap: (StartA < EndB) and (EndA > StartB)
      .lt('start_time', endTime) // New discount's start is before existing's end
      .gt('end_time', startTime); // New discount's end is after existing's start

    if (excludeDiscountId) {
      query.not('id', 'eq', excludeDiscountId);
    }

    const { data: overlappingDiscounts, error } = await query;

    if (error) {
      throw new Error(`Failed to check for overlapping discounts: ${error.message}`);
    }

    if (overlappingDiscounts && overlappingDiscounts.length > 0) {
      throw new Error('해당 시간대에 겹치는 할인이 이미 존재합니다.');
    }
  }

  async createDiscount(discountData: DiscountFormViewModel): Promise<DiscountEntity> {
    await this._checkForOverlappingDiscounts(
      discountData.menu_id,
      discountData.start_time,
      discountData.end_time
    );

    const now = new Date();
    const startTime = new Date(discountData.start_time);
    const endTime = new Date(discountData.end_time);
    const newDiscountIsActive = now >= startTime && now <= endTime;

    if (newDiscountIsActive) {
      const { error: updateError } = await this.supabase
        .from('discounts')
        .update({ is_active: false })
        .eq('menu_id', discountData.menu_id);

      if (updateError) {
        throw new Error(`Failed to deactivate existing discounts: ${updateError.message}`);
      }
    }

    const { data, error } = await this.supabase
      .from('discounts')
      .insert({
        menu_id: discountData.menu_id,
        discount_rate: discountData.discount_rate,
        start_time: discountData.start_time,
        end_time: discountData.end_time,
        quantity: discountData.quantity || null,
        is_active: newDiscountIsActive,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create discount: ${error.message}`);
    return data as DiscountEntity;
  }

  async endDiscount(discountId: string): Promise<DiscountEntity> {
    const { data, error } = await this.supabase
      .from('discounts')
      .update({ is_active: false })
      .eq('id', discountId)
      .select()
      .single();

    if (error) throw new Error(`Failed to end discount: ${error.message}`);
    return data as DiscountEntity;
  }

  async updateDiscount(discountId: string, discountData: Partial<DiscountFormViewModel>): Promise<DiscountEntity> {
    if (discountData.start_time && discountData.end_time && discountData.menu_id) {
        await this._checkForOverlappingDiscounts(
            discountData.menu_id,
            discountData.start_time,
            discountData.end_time,
            discountId
        );
    }

    const { data, error } = await this.supabase
      .from('discounts')
      .update({
        discount_rate: discountData.discount_rate,
        quantity: discountData.quantity,
        start_time: discountData.start_time,
        end_time: discountData.end_time,
        menu_id: discountData.menu_id,
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

  async getDiscountsByStoreId(storeId: string): Promise<DiscountViewModel[]> {
    const { data, error } = await this.supabase
      .from('discounts')
      .select('*, menu:store_menus!inner(name, store_id)')
      .eq('menu.store_id', storeId);

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

  async getDiscountsByMenuId(menuId: string): Promise<DiscountEntity[]> {
    const { data, error } = await this.supabase
      .from('discounts')
      .select('*')
      .eq('menu_id', menuId)
      .order('is_active', { ascending: false })
      .order('start_time', { ascending: true });

    if (error) throw new Error(`Failed to fetch discounts by menu ID: ${error.message}`);
    return data as DiscountEntity[];
  }
}
