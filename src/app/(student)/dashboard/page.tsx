'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { enrollmentsApi, gamificationApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/stores/auth';
import { ButtonLink } from '@/components/ui/button-link';
import { Progress } from '@/components/ui/progress';
import { CourseCardSkeleton } from '@/components/course/course-card';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isPending } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.mine({ limit: 100 }),
  });

  const { data: gamification } = useQuery({
    queryKey: ['gamification-me'],
    queryFn: gamificationApi.me,
  });

  const enrollments = data?.items ?? [];
  const completed = enrollments.filter((e) => e.status === 'COMPLETED');
  const inProgress = enrollments.filter((e) => e.status === 'IN_PROGRESS');
  const resume = inProgress[0];

  const getRankTitle = (lvl: number) => {
    if (lvl >= 10) return 'Grandmaster';
    if (lvl >= 7) return 'Senior Practitioner';
    if (lvl >= 5) return 'Skilled Artisan';
    if (lvl >= 3) return 'Adept Explorer';
    return 'Novice Apprentice';
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hello{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground mt-2">
            {inProgress.length > 0
              ? 'Pick up where you left off.'
              : 'Find a course and start learning.'}
          </p>
        </div>

        {gamification && (
          <div className="bg-card flex items-center gap-3 rounded-lg border p-3.5 shadow-xs">
            <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full">
              <Zap className="size-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">
                  Level {gamification.level.level}
                </span>
                <span className="text-muted-foreground text-xs">
                  · {getRankTitle(gamification.level.level)}
                </span>
              </div>
              <div className="mt-1.5 flex w-40 items-center gap-2">
                <Progress
                  value={gamification.level.progressPct}
                  className="h-1.5 flex-1"
                />
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {gamification.level.progressPct}%
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px] tabular-nums">
                {gamification.totalXp} XP · {gamification.level.xpToNextLevel} XP to Lvl {gamification.level.level + 1}
              </p>
            </div>
          </div>
        )}
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat
          icon={Zap}
          label="Total XP"
          value={gamification ? `${gamification.totalXp} XP` : '0 XP'}
        />
        <Stat icon={BookOpen} label="Enrolled" value={enrollments.length} />
        <Stat icon={TrendingUp} label="In progress" value={inProgress.length} />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} />
      </dl>

      {/* Category Skills breakdown */}
      {gamification && gamification.skills.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Skill Points & Specializations
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {gamification.skills.map((skill) => (
              <div
                key={skill.categoryId}
                className="bg-card flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs shadow-2xs"
              >
                <Award className="size-3.5 text-primary" />
                <span className="font-medium">{skill.categoryName}</span>
                <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  Lvl {skill.level}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {skill.sp} SP
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {isPending ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CourseCardSkeleton />
        </div>
      ) : resume ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Continue learning
          </h2>
          <div className="bg-card mt-4 rounded-lg border p-6">
            <p className="text-muted-foreground text-sm">
              {resume.course.category?.name ?? 'Course'}
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              {resume.course.title}
            </h3>
            <div className="mt-4 flex items-center gap-4">
              <Progress value={resume.progressPct} className="h-2 flex-1" />
              <span className="text-muted-foreground w-14 text-right text-sm tabular-nums">
                {resume.progressPct}%
              </span>
            </div>
            <ButtonLink className="mt-5" href={`/learn/${resume.course.id}`}>
              Continue <ArrowRight className="ml-2 size-4" />
            </ButtonLink>
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-lg border border-dashed p-10 text-center">
          <BookOpen className="text-muted-foreground/50 mx-auto size-10" />
          <h2 className="mt-4 font-semibold">You are not enrolled yet</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            Browse the catalog and join a course to start tracking progress.
          </p>
          <ButtonLink className="mt-6" href="/courses">
            Browse courses
          </ButtonLink>
        </section>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-card rounded-lg border p-5">
      <dt className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon className="size-4" />
        {label}
      </dt>
      <dd className="mt-2 text-3xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
