'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Anything that touches a course's curriculum invalidates three things:
 * the tree itself, the publish checklist derived from it, and the course list.
 *
 * Centralised because the checklist is the easy one to forget — `Course.updatedAt`
 * does not change when a module or lesson does, so keying the readiness query
 * on it leaves the checklist showing stale problems.
 */
export function useCourseRefresh(courseId: string) {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-course', courseId] }),
        queryClient.invalidateQueries({
          queryKey: ['publish-readiness', courseId],
        }),
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
      ]),
    [queryClient, courseId],
  );
}
