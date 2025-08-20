import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { MenuEntity } from '@/lib/entities/menus/menu.entity';
import { MenuFormViewModel, MenuListItemViewModel } from '@/lib/viewmodels/menus/menu.viewmodel';

export class MenuService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async registerMenu(menuData: MenuFormViewModel, storeId: string, thumbnailFile: File | null): Promise<MenuEntity> {
    // Step 1: Storage 업로드
let thumbnailUrl: string | null = null;
if (thumbnailFile) {
  const fileExtension = thumbnailFile.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;
  const { data: uploadData, error: uploadError } = await this.supabase.storage
    .from('thumbnails')
    .upload(fileName, thumbnailFile, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Storage upload failed:', uploadError);
    throw new Error(`Failed to upload menu thumbnail: ${uploadError.message}`);
  }

  if (!uploadData?.path) {
    throw new Error('Storage upload succeeded but path is undefined');
  }

  const { data: publicUrlData } = this.supabase.storage
    .from('thumbnails')
    .getPublicUrl(uploadData.path);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to get public URL for thumbnail');
  }

  thumbnailUrl = publicUrlData.publicUrl;
}

// Step 2: DB insert
console.log("🚀 Inserting with store_id:", storeId, "thumbnail:", thumbnailUrl);
const { data, error } = await this.supabase
  .from('store_menus')
  .insert({
    store_id: storeId,
    name: menuData.name,
    price: menuData.price,
    category: menuData.category,
    thumbnail: thumbnailUrl,
  })
  .select()
  .single();

    if (error) throw new Error(`Failed to register menu: ${error.message}`);
    return data as MenuEntity;
  }

  async getMenusByStoreId(storeId: string): Promise<MenuListItemViewModel[]> {
    const { data, error } = await this.supabase
      .from('store_menus')
      .select('*, discounts(count)')
      .eq('store_id', storeId);

    if (error) throw new Error(`Failed to fetch menus: ${error.message}`);

    return data.map(menu => {
      // Supabase returns the count in an array, handle case where no discounts exist.
      const discountCount = menu.discounts[0]?.count || 0;

      return {
        id: menu.id,
        name: menu.name,
        price: menu.price,
        thumbnailUrl: menu.thumbnail || '/no-image.jpg',
        category: menu.category,
        discountCount: discountCount,
      };
    }) as MenuListItemViewModel[];
  }

  async getMenuById(menuId: string): Promise<MenuEntity | null> {
    const { data, error } = await this.supabase
      .from('store_menus')
      .select('*')
      .eq('id', menuId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to fetch menu: ${error.message}`);
    }
    return data as MenuEntity;
  }

  async updateMenu(menuId: string, menuData: Partial<MenuFormViewModel>, thumbnailFile: File | null): Promise<MenuEntity> {
    let thumbnailUrl: string | null | undefined = undefined;
    if (thumbnailFile) {
      const fileExtension = thumbnailFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('thumbnails')
        .upload(fileName, thumbnailFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw new Error(`Failed to upload menu thumbnail: ${uploadError.message}`);
      }

      if (uploadData?.path) {
        const { data: publicUrlData } = this.supabase.storage
          .from('thumbnails')
          .getPublicUrl(uploadData.path);
        thumbnailUrl = publicUrlData.publicUrl;
      } else {
        throw new Error('Failed to get public URL for thumbnail.');
      }
    }

    const updatePayload: Partial<MenuEntity> = {};

    if (menuData.name !== undefined) {
      updatePayload.name = menuData.name;
    }

    if (menuData.price !== undefined) {
      updatePayload.price = menuData.price;
    }

    if (menuData.category !== undefined) {
      // updatePayload.category = menuData.category;
    }

    if (thumbnailUrl !== undefined) {
      updatePayload.thumbnail = thumbnailUrl;
    }

    const { data, error } = await this.supabase
      .from('store_menus')
      .update(updatePayload)
      .eq('id', menuId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update menu: ${error.message}`);
    return data as MenuEntity;
  }

  async deleteMenu(menuId: string): Promise<void> {
    const { error } = await this.supabase
      .from('store_menus')
      .delete()
      .eq('id', menuId);

    if (error) throw new Error(`Failed to delete menu: ${error.message}`);
  }
}
