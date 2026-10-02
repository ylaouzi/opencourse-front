'use client';

import { useQueryClient, useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/endpoints';
import type { PlayerPayload, ProgressUpdate } from '@/lib/types/api';

export const playerKey = (courseId: string) => ['player', courseId] as const;

/**
 * The curriculum sidebar payload. The layout and the lesson page both read it
 * from the same cache entry, so the sidebar does not refetch on every
 * navigation between lessons.
 */
export function usePlayer(courseId: string) {
  return useQuery({
    queryKey: playerKey(courseId),
    queryFn: () => enrollmentsApi.player(courseId),
  });
}

/**
 * Completing a lesson or submitting a quiz returns a fresh snapshot. Writing
 * it straight into the cache updates every tick, lock and percentage in the
 * sidebar without a second round trip.
 */
export function useApplyProgress(courseId: string) {
  const queryClient = useQueryClient();

  return (update: ProgressUpdate) =>
    queryClient.setQueryData<PlayerPayload>(playerKey(courseId), (current) =>
      current
        ? {
            ...current,
            progress: update.progress,
            modules: update.modules,
            finalQuiz: update.finalQuiz,
            enrollment: {
              ...current.enrollment,
              progressPct: update.progress.progressPct,
              status: update.progress.isComplete ? 'COMPLETED' : 'IN_PROGRESS',
            },
          }
        : current,
    );
}
