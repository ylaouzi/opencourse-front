'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/stores/auth';
import type { EnrollmentListItem } from '@/lib/types/api';

/**
 * One shared query for "which courses am I in".
 *
 * Server-rendered pages cannot know this (the token lives in localStorage), so
 * catalog badges and the enroll button both hydrate from here instead of every
 * screen refetching the catalog with auth attached.
 */
export function useMyEnrollments() {
  const { token, hydrated } = useAuthStore();

  const query = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.mine({ limit: 100 }),
    enabled: hydrated && Boolean(token),
  });

  const byCourseId = useMemo(() => {
    const map = new Map<string, EnrollmentListItem>();
    query.data?.items.forEach((item) => map.set(item.course.id, item));
    return map;
  }, [query.data]);

  return {
    ...query,
    byCourseId,
    signedIn: hydrated && Boolean(token),
    /** undefined while unknown, so "not enrolled" never shows before we know. */
    isEnrolled: (courseId: string): boolean | undefined => {
      if (!hydrated || !token) return undefined;
      if (!query.data) return undefined;
      return byCourseId.has(courseId);
    },
  };
}
