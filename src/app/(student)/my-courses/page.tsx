'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { enrollmentsApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import type { EnrollmentStatus } from '@/lib/types/api';
import { DIFFICULTY_LABEL, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ButtonLink } from '@/components/ui/button-link';
import { Badge } from '@/components/ui/badge';

const FILTERS: { value: EnrollmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function MyCoursesPage() {
  const [filter, setFilter] = useState<EnrollmentStatus | 'ALL'>('ALL');

  const { data, isPending, error } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.mine({ limit: 100 }),
  });

  const items = (data?.items ?? []).filter(
    (e) => filter === 'ALL' || e.status === filter,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My courses</h1>
        <p className="text-muted-foreground mt-2">
          Everything you have enrolled in.
        </p>
      </header>

      <div className="mb-6 flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-destructive rounded-lg border border-dashed p-6 text-sm">
          {errorMessage(error)}
        </p>
      ) : isPending ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-muted h-28 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <BookOpen className="text-muted-foreground/50 mx-auto size-10" />
          <p className="mt-4 font-medium">
            {filter === 'ALL'
              ? 'You are not enrolled in anything yet'
              : 'Nothing here'}
          </p>
          <ButtonLink className="mt-6" href="/courses">
            Browse courses
          </ButtonLink>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((enrollment) => (
            <Link
              key={enrollment.id}
              href={`/learn/${enrollment.course.id}`}
              className="bg-card hover:border-primary/40 block rounded-lg border p-5 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    {enrollment.course.category && (
                      <Badge variant="outline">
                        {enrollment.course.category.name}
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {DIFFICULTY_LABEL[enrollment.course.difficulty]}
                    </span>
                    {enrollment.course.status === 'ARCHIVED' && (
                      <Badge variant="outline" className="text-warning">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <h2 className="font-semibold">{enrollment.course.title}</h2>
                </div>

                {enrollment.status === 'COMPLETED' && (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="size-4" />
                      Completed {formatDate(enrollment.completedAt)}
                    </span>
                    <Link
                      href={`/certificates/${enrollment.course.id}`}
                      className="text-sm underline underline-offset-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Certificate
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <Progress value={enrollment.progressPct} className="h-2 flex-1" />
                <span className="text-muted-foreground w-12 text-right text-sm tabular-nums">
                  {enrollment.progressPct}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
