// store.form.ts
import { z } from 'zod';

// 기본 필드
export const storeFormBaseSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().min(1),
  category: z.string().optional(),
  // URL을 필수로 하지 않음 (파일 업로드로 채울 수 있으므로)
  storeThumbnail: z.string().optional(),
  menuCategory: z.array(z.string()).optional(),
  partnership: z.string().nullable().optional(),
});

// 화면에서 사용하는 폼 타입
export type StoreForm = z.infer<typeof storeFormBaseSchema>;

// 서버에 보낼 “최종” 스키마 (URL은 최종적으로 필요)
export const storeSubmitSchema = storeFormBaseSchema.extend({
  storeThumbnail: z.string().url(), // 최종적으로는 반드시 URL이어야 함
});