// domain/store/store-repository.ts
import { Store } from './store.entity';
import { Page, Id, Sort } from '../shared/repository';

// NOTE: 필터는 엔티티 관점으로(camelCase). DB는 snake_case 매핑은 어댑터에서 처리.
export type StoreFilter = {
  ownerId?: Id;
  isActive?: boolean;         // ← activated 대신 일관되게 camelCase
  category?: string;
  searchName?: string;        // 부분 검색 (ILIKE %...%)
};

export interface StoreRepository {
  /** 단건 조회 */
  getById(id: Id): Promise<Store | null>;

  /** 목록 조회: 필터 + 페이지 + 정렬 */
  list(
    filter?: StoreFilter,
    page?: Page,                                  // { limit?, offset? }
    sort?: Sort<'created_at' | 'name'>            // 정렬은 DB에서 처리(페이징 안정)
  ): Promise<Store[]>;

  /** 배치 조회(조립 최적화를 위해 가끔 유용) */
  listByIds(ids: Id[]): Promise<Store[]>;

  /** 소유자별 슈거 메서드 (내부적으로 list 호출) */
  findByOwner(ownerId: Id, page?: Page): Promise<Store[]>;

  /** 페이지네이션용 총개수 (필요 시) */
  count(filter?: StoreFilter): Promise<number>;

  /** 생성/수정(부분 업데이트 허용) — 어댑터에서 upsert(row) 사용 */
  save(store: Store): Promise<void>;

  /** 삭제(소프트 삭제가 필요하면 별도 메서드로 분리) */
  delete(id: Id): Promise<void>;
}