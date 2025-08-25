// app/(protected)/events/event.form.ts
import { z } from 'zod';

export const TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/; // HH:mm | HH:mm:ss
export const DATE = /^\d{4}-\d{2}-\d{2}$/;                         // YYYY-MM-DD
export const weekdaysEnum = z.enum(['mon','tue','wed','thu','fri','sat','sun']);

export const createEventSchema = z.object({
  event: z.object({
    storeId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().max(2000).nullable().optional(),
    startDate: z.string().regex(DATE, 'YYYY-MM-DD 형식이어야 합니다.'),
    endDate: z.string().regex(DATE, 'YYYY-MM-DD 형식이어야 합니다.'),
    weekdays: z.array(weekdaysEnum).min(1).max(7).optional(),
    happyHourStartTime: z.string().regex(TIME, 'HH:mm 또는 HH:mm:ss').optional(),
    happyHourEndTime: z.string().regex(TIME, 'HH:mm 또는 HH:mm:ss').optional(),
    isActive: z.boolean().optional(),
  })
  .refine(v => v.endDate >= v.startDate, { message: '종료일은 시작일 이후여야 합니다.', path: ['endDate'] })
  .refine(v => {
    const a = !!v.happyHourStartTime, b = !!v.happyHourEndTime;
    return (a && b) || (!a && !b);
  }, { message: '해피아워 시작/종료 시간은 함께 입력해야 합니다.', path: ['happyHourStartTime'] }),

  discounts: z.array(z.object({
    menuId: z.string().uuid(),
    discountRate: z.number().int().min(0).max(100),
    finalPrice: z.number().int().min(0),
    remaining: z.number().int().min(0).nullable().optional(),
    isActive: z.boolean().optional(),
  })).optional(),

  giftGroups: z.array(z.object({
    options: z.array(z.object({
      menuId: z.string().uuid(),
      remaining: z.number().int().min(0).nullable().optional(),
      isActive: z.boolean().optional(),
    })).min(1),
  })).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;