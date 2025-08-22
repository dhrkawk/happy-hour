// domain/menu/store-menu-repository.ts
import { StoreMenu } from './store-menu.entity';
import type { Id, Page, Sort } from '@/domain/shared/repository';

export type StoreMenuFilter = {
  storeId?: Id;            // 특정 매장의 메뉴만
  category?: string | null;
  searchName?: string;     // 부분 검색 (ILIKE %...%)
  priceMin?: number;       // 이상
  priceMax?: number;       // 이하
};

export interface StoreMenuRepository {
  /** 단건 조회 */
  getById(id: Id): Promise<StoreMenu | null>;

  /** 목록 조회 (필터/페이지/정렬) */
  list(
    filter?: StoreMenuFilter,
    page?: Page,
    sort?: Sort<'created_at' | 'name' | 'price'>
  ): Promise<StoreMenu[]>;

  /** 매장별 슈거 메서드 */
  listByStore(
    storeId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'name' | 'price'>
  ): Promise<StoreMenu[]>;

  /** 배치 조회 (N+1 방지용) */
  listByIds(ids: Id[]): Promise<StoreMenu[]>;

  /** 총 개수 (페이지네이션 UI용) */
  count(filter?: StoreMenuFilter): Promise<number>;

  /** 같은 매장 내 이름 중복 체크(선택) */
  existsByNameInStore(storeId: Id, name: string): Promise<boolean>;

  /** 생성/수정 (엔티티 → toRow → upsert) */
  save(menu: StoreMenu): Promise<void>;

  /** 삭제 */
  delete(id: Id): Promise<void>;
}