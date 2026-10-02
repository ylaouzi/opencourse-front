'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { catalogApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { CourseCard, CourseCardSkeleton } from './course-card';

export function FeaturedCourses() {
  const { data, isPending, error } = useQuery({
    queryKey: ['catalog', { sort: 'newest', limit: 3 }],
    queryFn: () => catalogApi.list({ sort: 'newest', limit: 3 }),
  });

  if (isPending) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm">
        <AlertCircle className="size-4 shrink-0" />
        {errorMessage(error, 'Could not load courses')}
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
        No published courses yet.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.items.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
