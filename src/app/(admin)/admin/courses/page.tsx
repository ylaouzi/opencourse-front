'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { adminCoursesApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import type { CourseStatus } from '@/lib/types/api';
import { DIFFICULTY_LABEL, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { StatusBadge } from '@/components/admin/status-badge';
import { useDebounced } from '@/lib/hooks/use-debounced';

const STATUSES: (CourseStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];

export default function AdminCoursesPage() {
  const [status, setStatus] = useState<CourseStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search, 350);

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-courses', { status, q, page }],
    queryFn: () =>
      adminCoursesApi.list({
        status: status === 'ALL' ? undefined : status,
        q: q || undefined,
        page,
        limit: 20,
        sortBy: 'updatedAt',
      }),
  });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create, edit and publish course content.
          </p>
        </div>
        <ButtonLink href="/admin/courses/new">
          <Plus className="mr-2 size-4" /> New course
        </ButtonLink>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search courses…"
            className="pl-8"
            aria-label="Search courses"
          />
        </div>
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                status === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-destructive rounded-lg border border-dashed p-6 text-sm">
          {errorMessage(error)}
        </p>
      ) : isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">No courses yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create your first course to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {data.items.map((course) => (
            <div
              key={course.id}
              className="hover:bg-muted/40 flex flex-wrap items-center gap-4 p-4 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="hover:text-primary font-medium"
                >
                  {course.title}
                </Link>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  /{course.slug} · {DIFFICULTY_LABEL[course.difficulty]}
                  {course.category ? ` · ${course.category.name}` : ''} ·
                  updated {formatDate(course.updatedAt)}
                </p>
              </div>

              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="tabular-nums">
                  {course._count.modules} mod
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Users className="size-3.5" />
                  {course._count.enrollments}
                </span>
                <StatusBadge status={course.status} />
              </div>

              <ButtonLink
                variant="outline"
                size="sm"
                href={`/admin/courses/${course.id}`}
              >
                Edit
              </ButtonLink>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {data.page} of {data.totalPages} · {data.total} courses
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
