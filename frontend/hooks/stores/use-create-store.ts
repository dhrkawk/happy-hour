// hooks/use-create-store.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storeSubmitSchema, type StoreForm } from '@/app/(protected)/profile/store-registration/store.form';
import { createClient } from '@/infra/supabase/shared/client';

type CreateStoreResponse = { id: string };
const BUCKET = 'store-thumbnails';

async function uploadStoreThumbnail(file: File): Promise<string> {
  const sb = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `stores/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: '3600',
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function useCreateStore(opts?: {
  onSuccess?: (id: string) => void;
  onError?: (err: Error) => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['stores', 'create'],
    // form + file을 받아서 처리
    mutationFn: async ({ form, file }: { form: StoreForm; file?: File | null }) => {
      let payload = { ...form };

      // 1) 파일이 있으면 먼저 업로드해 URL 확보
      if (file) {
        const url = await uploadStoreThumbnail(file);
        payload.storeThumbnail = url;
      }

      // 2) 최종 검증 (이때는 URL이 반드시 존재)
      payload = storeSubmitSchema.parse(payload);

      // 3) API 호출
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to create store');
      }
      return (await res.json()) as CreateStoreResponse;
    },
    onSuccess: async ({ id }) => {
      await qc.invalidateQueries({ queryKey: ['stores', 'list'] });
      opts?.onSuccess?.(id);
    },
    onError: (e) => opts?.onError?.(e as Error),
  });
}