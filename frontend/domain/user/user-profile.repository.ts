// domain/user/user-profile-repository.ts
import type { Id, Page } from '@/domain/shared/repository';
import { UserProfile } from './user-profile.entity';

export type UserProfileFilter = {
  searchEmail?: string;          // 관리용 검색 (optional)
  role?: 'customer' | 'owner' | 'admin' | string;
  marketingConsent?: boolean;
};

export interface UserProfileRepository {
  /** 단건 조회 */
  getById(userId: Id): Promise<UserProfile | null>;
  getByEmail(email: string): Promise<UserProfile | null>;

  /** 배치 조회 */
  listByIds(userIds: Id[]): Promise<UserProfile[]>;

  /** (관리 화면 등) 목록 조회 */
  list(filter?: UserProfileFilter, page?: Page): Promise<UserProfile[]>;
  count(filter?: UserProfileFilter): Promise<number>;

  /** 생성/수정: 엔티티 → toRow() → upsert 통일 */
  save(profile: UserProfile): Promise<void>;

  /** 의미 있는 도메인 동작 (원자적 업데이트 의도) */
  setMarketingConsent(userId: Id, consent: boolean): Promise<void>;
  incrementBookings(userId: Id, by?: number): Promise<void>;   // default by=1
  addSavings(userId: Id, amount: number): Promise<void>;       // 양수만 허용 권장

  /** 삭제(필요 시) */
  delete(userId: Id): Promise<void>;
}