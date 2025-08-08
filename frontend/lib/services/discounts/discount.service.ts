import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { DiscountEntity } from '@/lib/entities/discounts/discount.entity';
import { DiscountFormViewModel, DiscountViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';

export class DiscountService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async createDiscount(discountData: DiscountFormViewModel): Promise<DiscountEntity> {
    // 1. 기간 중복 검사
    const existingDiscounts = await this.getDiscountsByMenuId(discountData.menu_id);
    const newStartTime = new Date(discountData.start_time);
    const newEndTime = new Date(discountData.end_time);

    for (const existing of existingDiscounts) {
      // 활성 할인만 검사
      if (!existing.is_active) continue;

      const existingStartTime = new Date(existing.start_time);
      const existingEndTime = new Date(existing.end_time);

      // 기간 중복 조건: (새 시작 < 기존 종료) && (새 종료 > 기존 시작)
      if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
        throw new Error('동일한 기간에 활성 할인이 있습니다!');
      }
    }

    // 2. 할인 등록
    const { data, error } = await this.supabase
      .from('discounts')
      .insert({
        menu_id: discountData.menu_id,
        discount_rate: discountData.discount_rate,
        start_time: discountData.start_time,
        end_time: discountData.end_time,
        quantity: discountData.quantity || null,
        is_active: true,
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
      .select('*, menu:store_menus!inner(name, store_id)') // Join with store_menus to get menu name and store_id
      .eq('menu.store_id', storeId); // Filter on the joined store_menus table's store_id

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

  // async getDiscountById(discountId: string): Promise<DiscountEntity | null> {
  //   const { data, error } = await this.supabase
  //     .from('discounts')
  //     .select('*, menu:store_menus(name)')
  //     .eq('id', discountId)
  //     .single();

  //   if (error) {
  //     if (error.code === 'PGRST116') return null; // No rows found
  //     throw new Error(`Failed to fetch discount: ${error.message}`);
  //   }
  //   return data as DiscountEntity;
  // }

    async getDiscountsByMenuId(menuId: string): Promise<DiscountEntity[]> {
    const { data, error } = await this.supabase
      .from('discounts')
      .select('*')
      .eq('menu_id', menuId)
      .order('is_active', { ascending: false }) // 활성 할인이 먼저 오도록
      .order('start_time', { ascending: true }); // 시작 시간 기준으로 정렬

    if (error) throw new Error(`Failed to fetch discounts by menu ID: ${error.message}`);
    return data as DiscountEntity[];
  }
}
