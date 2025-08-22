export type Page = { limit?: number; offset?: number };
export type Id = string;

export type SortOrder = 'asc' | 'desc';
export type Sort<TFields extends string = string> = { field: TFields; order?: SortOrder };

// 트랜잭션이 필요한 경우를 대비한 선택형 포트 (구현체가 지원하지 않으면 무시)
export interface UnitOfWork {
  withTransaction<T>(work: () => Promise<T>): Promise<T>;
}