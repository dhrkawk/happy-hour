import { StoreEntity } from '@/lib/entities/stores/store.entity';
import { StoreCardViewModel, createStoreCardViewModel } from '@/lib/viewmodels/store-card.viewmodel';

export class StoreApiClient {
  private baseUrl: string = '/api/stores';

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
}