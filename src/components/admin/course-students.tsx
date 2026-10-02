'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { adminCoursesApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { formatDate, initials } from '@/lib/format';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function CourseStudents({ courseId }: { courseId: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['admin-course-students', courseId],
    queryFn: () => adminCoursesApi.students(courseId, { limit: 50 }),
  });

  if (error) {
    return (
      <p className="text-destructive rounded-lg border border-dashed p-6 text-sm">
        {errorMessage(error)}
      </p>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Users className="text-muted-foreground/50 mx-auto size-10" />
        <p className="mt-4 font-medium">No one has enrolled yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {data.items.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-4 p-4">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">
              {initials(row.user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{row.user.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {row.user.email}
            </p>
          </div>

          <div className="w-40">
            <Progress value={row.progressPct} className="h-2" />
            <p className="text-muted-foreground mt-1 text-xs tabular-nums">
              {row.progressPct}%
            </p>
          </div>

          <div className="text-muted-foreground w-40 text-xs">
            <p>Joined {formatDate(row.enrolledAt)}</p>
            <p>
              {row.lastActivityAt
                ? `Active ${formatDate(row.lastActivityAt)}`
                : 'No activity yet'}
            </p>
          </div>

          {row.status === 'COMPLETED' ? (
            <Badge className="border-0 bg-success-subtle text-success">
              Completed
            </Badge>
          ) : (
            <Badge variant="outline">In progress</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
