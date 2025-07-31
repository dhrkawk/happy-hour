import { StoreDetailViewModel, createStoreDetailViewModel } from '@/lib/viewmodels/store-detail.viewmodel';
import { StoreDetailEntity } from '@/lib/entities/stores/store-detail.entity';

export class storeDetailApiClient {
  private baseUrl: string;

  constructor(storeId: string) {
    this.baseUrl = `/api/stores/${storeId}`;
  }

  async getStoreById(userLocation: { lat: number; lng: number;}): Promise<StoreDetailViewModel> {
    const url = `${this.baseUrl}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch store');
    }
    const storeDetailEntity: StoreDetailEntity = await response.json();

    // Convert StoreDetailEntity to StoreDetailViewModel
    const viewModel = createStoreDetailViewModel(storeDetailEntity, userLocation)
    return viewModel;
  }
}