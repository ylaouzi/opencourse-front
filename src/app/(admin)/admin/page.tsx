'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BookMarked,
  CheckCircle2,
  ListChecks,
  Plus,
  Users,
} from 'lucide-react';
import { adminStatsApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { plural } from '@/lib/format';
import { ButtonLink } from '@/components/ui/button-link';
import {
  BarList,
  ChartCard,
  Meter,
  StatTile,
  TrendArea,
} from '@/components/admin/charts';

export default function AdminOverviewPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminStatsApi.overview,
  });

  if (error) {
    return (
      <p className="text-destructive rounded-lg border border-dashed p-6 text-sm">
        {errorMessage(error)}
      </p>
    );
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            How the platform is doing.
          </p>
        </div>
        <ButtonLink href="/admin/courses/new">
          <Plus className="mr-2 size-4" /> New course
        </ButtonLink>
      </header>

      {isPending ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="bg-muted h-56 animate-pulse rounded-lg" />
        </div>
      ) : (
        <>
          {/* Headline numbers are stat tiles, not charts. */}
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              icon={Users}
              label="Learners"
              value={data.users.students}
              hint={`${plural(data.users.admins, 'admin')}`}
            />
            <StatTile
              icon={BookMarked}
              label="Published courses"
              value={data.courses.published}
              hint={`${data.courses.draft} draft · ${data.courses.archived} archived`}
            />
            <StatTile
              icon={CheckCircle2}
              label="Enrolments"
              value={data.enrollments.total}
              hint={`${data.enrollments.completed} completed`}
            />
            <StatTile
              icon={ListChecks}
              label="Quiz attempts"
              value={data.quizzes.attempts}
              hint={`average score ${data.quizzes.averageScore}%`}
            />
          </dl>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <ChartCard
              title="New accounts"
              subtitle="Signups over the last 30 days"
            >
              <TrendArea
                points={data.signups.map((s) => ({
                  label: s.day,
                  value: s.count,
                }))}
                formatLabel={(iso) =>
                  new Date(iso).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
            </ChartCard>

            <ChartCard title="Rates" subtitle="Across the whole platform">
              <div className="space-y-6">
                <Meter
                  label="Course completion"
                  percent={data.enrollments.completionRate}
                  caption={`${data.enrollments.completed} of ${data.enrollments.total} enrolments finished`}
                />
                <Meter
                  label="Quiz pass rate"
                  percent={data.quizzes.passRate}
                  caption={`${data.quizzes.passed} of ${data.quizzes.attempts} attempts passed`}
                />
              </div>
            </ChartCard>
          </div>

          <ChartCard
            className="mt-6"
            title="Most enrolled courses"
            subtitle="Published and archived courses by enrolment"
          >
            <BarList
              items={data.topCourses.map((c) => ({
                id: c.id,
                label: c.title,
                value: c.enrollments,
                caption:
                  c.completions > 0
                    ? `${plural(c.completions, 'learner')} finished`
                    : undefined,
              }))}
            />
          </ChartCard>

          <p className="text-muted-foreground mt-6 text-sm">
            <Link href="/admin/courses" className="hover:text-foreground underline underline-offset-4">
              Manage courses
            </Link>
            {' · '}
            <Link href="/admin/users" className="hover:text-foreground underline underline-offset-4">
              Manage users
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
