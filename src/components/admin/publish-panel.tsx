'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminCoursesApi } from '@/lib/api/endpoints';
import { useCourseRefresh } from '@/lib/hooks/use-course-refresh';
import { errorMessage, errorMessages } from '@/lib/api/client';
import type { AdminCourseTree, CourseStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';

/**
 * Mirrors the backend publish guard as a live checklist. The dry-run endpoint
 * exists precisely so authors do not discover problems by clicking Publish
 * and reading a 400 (plan §4.4).
 */
export function PublishPanel({ course }: { course: AdminCourseTree }) {
  const refresh = useCourseRefresh(course.id);

  const { data: readiness, isPending } = useQuery({
    queryKey: ['publish-readiness', course.id],
    queryFn: () => adminCoursesApi.readiness(course.id),
  });

  const setStatus = useMutation({
    mutationFn: (status: CourseStatus) =>
      adminCoursesApi.setStatus(course.id, status),
    onSuccess: async (_, status) => {
      await refresh();
      toast.success(`Course ${status.toLowerCase()}`);
    },
    onError: (error) => {
      // The guard returns its problems as a string array.
      const problems = errorMessages(error);
      if (problems.length > 1) {
        toast.error(`Cannot publish — ${problems.length} problems`, {
          description: problems.slice(0, 4).join('\n'),
        });
      } else {
        toast.error(errorMessage(error));
      }
    },
  });

  const ready = readiness?.ready ?? false;

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="bg-card rounded-lg border p-5">
        <h2 className="font-medium">Publish checklist</h2>

        {isPending ? (
          <div className="mt-4 space-y-2">
            <div className="bg-muted h-4 animate-pulse rounded" />
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          </div>
        ) : ready ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            Everything checks out. This course can be published.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {readiness?.problems.map((problem) => (
              <li
                key={problem}
                className="text-muted-foreground flex items-start gap-2 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>{problem}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 space-y-2">
          {course.status !== 'PUBLISHED' && (
            <Button
              className="w-full"
              disabled={!ready || setStatus.isPending}
              onClick={() => setStatus.mutate('PUBLISHED')}
            >
              {setStatus.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Publish course
            </Button>
          )}

          {course.status === 'PUBLISHED' && (
            <Button
              variant="outline"
              className="w-full"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate('ARCHIVED')}
            >
              Archive course
            </Button>
          )}

          {course.status === 'ARCHIVED' && (
            <p className="text-muted-foreground text-xs">
              Archived courses stay available to learners already enrolled, but
              are hidden from the catalog.
            </p>
          )}

          {course.status === 'PUBLISHED' && course._count.enrollments === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate('DRAFT')}
            >
              Back to draft
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
