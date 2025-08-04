import { StoreEntity } from '@/lib/entities/stores/store.entity';
import { StoreCardViewModel, createStoreCardViewModel } from '@/lib/viewmodels/store-card.viewmodel';
import { StoreDetailViewModel, createStoreDetailViewModel } from '@/lib/viewmodels/store-detail.viewmodel';
import { StoreDetailEntity } from '@/lib/entities/stores/store-detail.entity';

export class StoreApiClient {
  private baseUrl: string = '/api/stores';

  // 전체 매장 목록 조회
  async getAllStores(userLocation: { lat: number; lng: number;}): Promise<StoreCardViewModel[]> {
    const url = `${this.baseUrl}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch stores');
    }
    const storeEntities: StoreEntity[] = await response.json();
    
    // Convert StoreEntity to StoreCardViewModel
    const storeList = storeEntities.map(entity => createStoreCardViewModel(entity, userLocation));
    const viewModels_distance = StoreCardViewModel.sortByDistance(storeList);
    const viewModels = StoreCardViewModel.sortByDiscount(viewModels_distance);
    return viewModels;
  }

  // TODO: 매장 등록
  async registerStore(store: StoreEntity): Promise<StoreCardViewModel> {
    const url = `${this.baseUrl}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(store),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register store');
    }
    const storeEntity: StoreEntity = await response.json();
    return createStoreCardViewModel(storeEntity, { lat: 0, lng: 0 }); // Default location for new store
  }

  // 매장 상세 조회
  async getStoreById(storeId: string, userLocation: { lat: number; lng: number; }): Promise<StoreDetailViewModel> {
    const url = `${this.baseUrl}/${storeId}`;
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

  // TODO: 매장 수정
  async updateStore(storeId: string, store: StoreEntity): Promise<StoreCardViewModel> {
    const url = `${this.baseUrl}/${storeId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(store),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update store');
    }
    const storeEntity: StoreEntity = await response.json();
    return createStoreCardViewModel(storeEntity, { lat: 0, lng: 0 }); // Default location for updated store
  }

  // TODO: 매장 삭제
  async deleteStore(storeId: string): Promise<void> {
    const url = `${this.baseUrl}/${storeId}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete store');
    }
  }
}