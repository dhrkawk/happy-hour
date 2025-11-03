// lib/vm/profile.vm.ts
import type { UserProfile } from "@/domain/entities/entities";

export type UserProfileVM = {
  userId: string;
  name: string;
  email: string;
  phoneText: string;
  totalBookings: number;
  totalSavingsText: string;
  role: string;
  marketingConsent: boolean;
};

const phonePretty = (raw: string) => {
  const d = (raw ?? '').replace(/\D/g, '');
  if (d.startsWith('02')) {
    if (d.length === 9)  return d.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (d.startsWith('010') && d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  return raw ?? '';
};

export const buildUserProfileVM = (p: UserProfile): UserProfileVM => ({
  userId: p.userId,
  name: p.name,
  email: p.email,
  phoneText: phonePretty(p.phoneNumber),
  totalBookings: p.totalBookings,
  totalSavingsText: `${Math.round(p.totalSavings ?? 0).toLocaleString()}원`,
  role: p.role,
  marketingConsent: !!p.marketingConsent,
});