// domain/user/user-profile.entity.ts
import { Guard } from '../shared/guard';

export class UserProfile {
  private constructor(
    public readonly userId: string,
    public email: string,
    public providerId: string | null,
    public name: string,
    public phoneNumber: string,
    public totalBookings: number,
    public totalSavings: number,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public role: 'customer' | 'owner' | string,
    public provider: string | null,
    public marketingConsent: boolean
  ) {}

  static create(i: {
    user_id: string; email: string; provider_id?: string | null; name: string;
    phone_number: string; total_bookings?: number; total_savings?: number;
    created_at?: string | Date; updated_at?: string | Date;
    role?: string; provider?: string | null; marketing_consent?: boolean;
  }): UserProfile {
    return new UserProfile(
      Guard.uuid(i.user_id, 'user_profiles.user_id'),
      Guard.email(i.email, 'user_profiles.email'),   // ← 여기 사용
      i.provider_id ?? null,
      Guard.nonEmpty(i.name, 'user_profiles.name'),
      Guard.nonEmpty(i.phone_number, 'user_profiles.phone_number'),
      Number(i.total_bookings ?? 0),
      Number(i.total_savings ?? 0),
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'user_profiles.created_at'),
      Guard.isoDate(i.updated_at ?? new Date().toISOString(), 'user_profiles.updated_at'),
      String(i.role ?? 'customer'),
      i.provider ?? null,
      Boolean(i.marketing_consent ?? false)
    );
  }

  toRow() {
    return {
      user_id: this.userId,
      email: this.email,
      provider_id: this.providerId,
      name: this.name,
      phone_number: this.phoneNumber,
      total_bookings: this.totalBookings,
      total_savings: this.totalSavings,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      role: this.role,
      provider: this.provider,
      marketing_consent: this.marketingConsent
    };
  }
}