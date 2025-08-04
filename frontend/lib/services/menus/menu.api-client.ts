import { MenuFormViewModel, MenuListItemViewModel } from '@/lib/viewmodels/menus/menu.viewmodel';
import { MenuEntity } from '@/lib/entities/menus/menu.entity';

export class MenuApiClient {
  private baseUrl: string;
  private origin: string | undefined;

  constructor(storeId: string, origin?: string) {
    this.baseUrl = `/api/stores/${storeId}/menus`;
    this.origin = origin;
  }

  async getMenus(): Promise<MenuListItemViewModel[]> {
    const url = this.origin ? `${this.origin}${this.baseUrl}` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch menus');
    }
    return response.json();
  }

  async getMenuById(menuId: string): Promise<MenuEntity> {
    const response = await fetch(`${this.baseUrl}/${menuId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch menu');
    }
    return response.json();
  }

  async registerMenu(menuData: MenuFormViewModel, thumbnailFile: File | null): Promise<MenuEntity> {
    const formData = new FormData();
    formData.append('name', menuData.name);
    formData.append('price', menuData.price.toString());
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register menu');
    }
    return response.json();
  }

  async updateMenu(menuId: string, menuData: Partial<MenuFormViewModel>, thumbnailFile: File | null): Promise<MenuEntity> {
    const formData = new FormData();
    if (menuData.name) formData.append('name', menuData.name);
    if (menuData.price !== undefined) formData.append('price', menuData.price.toString());
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    const response = await fetch(`${this.baseUrl}/${menuId}`, {
      method: 'PATCH',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update menu');
    }
    return response.json();
  }

  async deleteMenu(menuId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${menuId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete menu');
    }
  }
}
