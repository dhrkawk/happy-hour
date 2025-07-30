import { DiscountFormViewModel, DiscountListItemViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';
import { DiscountEntity } from '@/lib/entities/discounts/discount.entity';

export class DiscountApiClient {
  private baseUrl: string;

  constructor(storeId: string) {
    this.baseUrl = `/api/stores/${storeId}/discounts`;
  }

  async getDiscounts(): Promise<DiscountListItemViewModel[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch discounts');
    }
    return response.json();
  }

  async getDiscountById(discountId: string): Promise<DiscountEntity> {
    const response = await fetch(`${this.baseUrl}/${discountId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch discount');
    }
    return response.json();
  }

  async registerDiscount(discountData: DiscountFormViewModel): Promise<DiscountEntity> {
    const response = await fetch(this.baseUrl, {
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

  async updateDiscount(discountId: string, discountData: Partial<DiscountFormViewModel>): Promise<DiscountEntity> {
    const response = await fetch(`${this.baseUrl}/${discountId}`, {
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

  async deleteDiscount(discountId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${discountId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete discount');
    }
  }
}
