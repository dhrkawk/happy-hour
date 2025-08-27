// hooks/events/use-create-event.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEventSchema, type CreateEventInput } from '@/app/(protected)/profile/store-management/[id]/event/event.form';

/** HH:mm → HH:mm:ss 보정 */
const toHHMMSS = (t?: string) => (t && t.length === 5 ? `${t}:00` : t);

const normalizePayload = (input: CreateEventInput): CreateEventInput => {
  const e = input.event;
  return {
    ...input,
    event: {
      ...e,
      happyHourStartTime: toHHMMSS(e.happyHourStartTime),
      happyHourEndTime: toHHMMSS(e.happyHourEndTime),
    },
  };
};

export type CreateEventResponse = { id: string };

export function useCreateEvent(opts?: {
  onSuccess?: (id: string) => void;
  onError?: (err: Error) => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['events', 'create'],
    mutationFn: async (raw: CreateEventInput) => {
      // 1) 클라 검증
      const parsed = createEventSchema.parse(raw);
      // 2) 포맷 정규화(HH:mm → HH:mm:ss)
      const payload = normalizePayload(parsed);

      // 3) 호출 (POST /api/events)
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to create event');
      }
      return (await res.json()) as CreateEventResponse;
    },
    onSuccess: async ({ id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['events', 'list'] }),
        qc.invalidateQueries({ queryKey: ['stores', 'list'] }),
        qc.invalidateQueries({ queryKey: ['stores', 'detail'] }),
      ]);
      opts?.onSuccess?.(id);
    },
    onError: (e) => opts?.onError?.(e as Error),
  });
}