// domain/menu/store-menu.entity.ts
import { Guard } from '../shared/guard';

export class StoreMenu {
  private constructor(
    public readonly id: string,
    public readonly storeId: string,
    public name: string,
    public price: { value: number },
    public thumbnail: string | null,
    public readonly createdAt: string,
    public description: string | null,
    public category: string | null
  ) {}

  static create(i: {
    id: string; store_id: string; name: string; price: number;
    thumbnail?: string | null; created_at?: string | Date;
    description?: string | null; category?: string | null;
  }): StoreMenu {
    return new StoreMenu(
      Guard.uuid(i.id, 'store_menus.id'),
      Guard.uuid(i.store_id, 'store_menus.store_id'),
      Guard.nonEmpty(i.name, 'store_menus.name'),
      { value: Guard.posInt(i.price, 'store_menus.price') },
      i.thumbnail ?? null,
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'store_menus.created_at'),
      i.description ?? null,
      i.category ?? null
    );
  }

  toRow() {
    return {
      id: this.id,
      store_id: this.storeId,
      name: this.name,
      price: this.price.value,
      thumbnail: this.thumbnail,
      created_at: this.createdAt,
      description: this.description,
      category: this.category ?? '기타'
    };
  }
}