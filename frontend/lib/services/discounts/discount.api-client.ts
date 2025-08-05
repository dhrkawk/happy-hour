import { DiscountDetailViewModel, DiscountFormViewModel, DiscountViewModel, createDiscountDetailViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';
import { DiscountEntity } from '@/lib/entities/discounts/discount.entity';

export class DiscountApiClient {
  static async getDiscountsByStoreId(storeId: string, origin?: string): Promise<DiscountViewModel[]> {
    const baseUrl = origin ? `${origin}/api/discounts` : '/api/discounts';
    const response = await fetch(`${baseUrl}?store_id=${storeId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch discounts');
    }
    return response.json();
  }

  static async getDiscountsByMenuId(storeId: string, menuId: string): Promise<DiscountDetailViewModel[]> {
    const response = await fetch(`/api/menus/${menuId}/discounts`);
    if (!response.ok) {
      if (response.status === 404) return [];
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch discounts by menu ID');
    }

    const { discounts } = await response.json();

    return discounts.map(createDiscountDetailViewModel);
  }

  static async registerDiscount(discountData: DiscountFormViewModel): Promise<DiscountEntity> {
    const menuId = discountData.menu_id;
    const response = await fetch(`/api/menus/${menuId}/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discountData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register discount');
    }
    return response.json();
  }

  static async updateDiscount(discountId: string, discountData: Partial<DiscountFormViewModel>): Promise<DiscountEntity> {
    const response = await fetch(`/api/discounts/${discountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discountData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update discount');
    }
    return response.json();
  }

  static async deleteDiscount(discountId: string): Promise<void> {
    const response = await fetch(`/api/discounts/${discountId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete discount');
    }
  }
}
