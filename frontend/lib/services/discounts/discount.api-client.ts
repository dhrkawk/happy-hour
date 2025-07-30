import { DiscountFormViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';
import { DiscountEntity } from '@/lib/entities/discounts/discount.entity';

export class DiscountApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/discounts';
  }

  async registerDiscount(discountData: DiscountFormViewModel, storeId: string, menuId: string): Promise<DiscountEntity> {
    const formData = new FormData();
    formData.append('store_id', storeId);
    formData.append('menu_id', menuId);
    formData.append('discount_rate', discountData.discount_rate.toString());
    if (discountData.quantity !== null && discountData.quantity !== undefined) {
      formData.append('quantity', discountData.quantity.toString());
    }
    formData.append('start_time', discountData.start_time);
    formData.append('end_time', discountData.end_time);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register discount');
    }
    return response.json();
  }

  // TODO: get, update, delete discount methods if needed
}
