'use client';

import { BookOpen } from 'lucide-react';
import type { CourseCard as CourseCardType } from '@/lib/types/api';
import { useMyEnrollments } from '@/lib/hooks/use-my-enrollments';
import { CourseCard } from './course-card';

/**
 * Client component, but it still renders on the server for the initial HTML —
 * the catalog stays crawlable. Enrolled badges are layered on after hydration,
 * because the token that reveals them is only available in the browser.
 */
export function CourseGrid({ courses }: { courses: CourseCardType[] }) {
  const { isEnrolled } = useMyEnrollments();

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <BookOpen className="text-muted-foreground/50 mx-auto size-10" />
        <p className="mt-4 font-medium">No courses found</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Try removing a filter or searching for something else.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={{ ...course, enrolled: isEnrolled(course.id) }}
        />
      ))}
    </div>
  );
}
