// domain/store/store.entity.ts
import { Guard } from '../shared/guard';

export class Store {
  private constructor(
    public readonly id: string,
    public name: string,
    public address: string,
    public readonly lat: number,
    public readonly lng: number,
    public phone: string,
    public readonly createdAt: string,
    public category: string,
    public isActive: boolean,           // 엔티티는 camelCase
    public storeThumbnail: string,
    public ownerId: string,
    public menuCategory: string[],
    public partnership: string | null
  ) {}

  /** DB row(snake_case) → Entity */
  static create(i: {
    id: string; name: string; address: string; lat: number | string; lng: number | string;
    phone: string; created_at?: string | Date; category?: string;
    is_active?: boolean;                  // ← DB 컬럼 이름에 맞춤
    store_thumbnail: string; owner_id: string;
    menu_category?: string[] | null; partnership?: string | null;
  }): Store {
    return new Store(
      Guard.uuid(i.id, 'stores.id'),
      Guard.nonEmpty(i.name, 'stores.name'),
      Guard.nonEmpty(i.address, 'stores.address'),
      Number(i.lat),
      Number(i.lng),
      Guard.nonEmpty(i.phone, 'stores.phone'),
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'stores.created_at'),
      String(i.category ?? ''),
      Boolean(i.is_active ?? false),      // ← 올바른 입력 키 사용
      Guard.nonEmpty(i.store_thumbnail, 'stores.store_thumbnail'),
      Guard.uuid(i.owner_id, 'stores.owner_id'),
      Guard.stringArray(i.menu_category ?? [], 'stores.menu_category'),
      i.partnership ?? null
    );
  }

  // Insert용 toRow (id 없음)
  static toInsertRow(i: {
    name: string; address: string; lat: number; lng: number; phone: string;
    category?: string; store_thumbnail: string; owner_id: string;
    menu_category?: string[] | null; partnership?: string | null; created_at?: string | Date;
    is_active?: boolean;
  }) {
    return {
      // id 없음! DB가 생성
      name: i.name,
      address: i.address,
      lat: i.lat,
      lng: i.lng,
      phone: i.phone,
      category: i.category ?? '',
      store_thumbnail: i.store_thumbnail,
      owner_id: i.owner_id,
      menu_category: i.menu_category ?? [],
      partnership: i.partnership ?? null,
      created_at: (i.created_at ?? new Date().toISOString()) as string,
      is_active: i.is_active ?? true,
    };
  }

  // Update용 toRow (id 포함)
  toUpdateRow() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      lat: this.lat,
      lng: this.lng,
      phone: this.phone,
      category: this.category,
      store_thumbnail: this.storeThumbnail,
      owner_id: this.ownerId,
      menu_category: this.menuCategory,
      partnership: this.partnership,
      is_active: this.isActive,
      created_at: this.createdAt,
    };
  }

  activate() { this.isActive = true; }
  deactivate() { this.isActive = false; }
}