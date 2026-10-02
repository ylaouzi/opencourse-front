'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { CourseDetail } from '@/lib/types/api';
import { enrollmentsApi, gamificationApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/stores/auth';
import { errorMessage } from '@/lib/api/client';
import { useMyEnrollments } from '@/lib/hooks/use-my-enrollments';
import { formatDuration, plural } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Progress } from '@/components/ui/progress';
import { Settings2 } from 'lucide-react';
import { CourseCover } from './course-cover';

export function EnrollPanel({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signedIn, byCourseId, isPending } = useMyEnrollments();
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === 'ADMIN';

  const { data: gamification } = useQuery({
    queryKey: ['gamification-me'],
    queryFn: gamificationApi.me,
    enabled: signedIn && !isAdmin,
  });

  const enrollment = byCourseId.get(course.id);

  const enroll = useMutation({
    mutationFn: () => enrollmentsApi.enroll(course.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      toast.success(`You are enrolled in ${course.title}`);
      router.push(`/learn/${course.id}`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const isArchived = course.status === 'ARCHIVED';

  const unmetPrerequisites: string[] = [];
  if (course.prerequisites && course.prerequisites.length > 0 && gamification) {
    for (const prereq of course.prerequisites) {
      if (
        prereq.minGlobalLevel &&
        gamification.level.level < prereq.minGlobalLevel
      ) {
        unmetPrerequisites.push(
          `Requires Account Level ${prereq.minGlobalLevel} (you are Level ${gamification.level.level})`,
        );
      }
      if (prereq.categoryId && prereq.minCategoryLevel) {
        const skill = gamification.skills.find(
          (s) => s.categoryId === prereq.categoryId,
        );
        const currentSkillLevel = skill?.level ?? 1;
        if (currentSkillLevel < prereq.minCategoryLevel) {
          const categoryName = prereq.category?.name ?? 'Category';
          unmetPrerequisites.push(
            `Requires ${categoryName} Level ${prereq.minCategoryLevel} (you are Level ${currentSkillLevel})`,
          );
        }
      }
      if (prereq.prerequisiteCourseId) {
        const prereqEnrollment = byCourseId.get(prereq.prerequisiteCourseId);
        if (prereqEnrollment?.status !== 'COMPLETED') {
          const courseTitle =
            prereq.prerequisiteCourse?.title ?? 'required course';
          unmetPrerequisites.push(
            `Must complete prerequisite course: "${courseTitle}"`,
          );
        }
      }
    }
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
        <CourseCover
          src={course.coverUrl}
          seed={course.id}
          title={course.title}
          className="aspect-[16/9]"
        />

        <div className="space-y-4 p-5">
          {isAdmin ? (
            <>
              {/* The API returns 403 for an admin enrolment (admin enrolments
                  would count toward the platform metrics the admin console
                  reports), so never offer a button that cannot succeed. */}
              <p className="text-muted-foreground text-sm">
                You are signed in as an admin. Admin accounts do not enrol — use
                Preview to see this course as a learner does.
              </p>
              <ButtonLink
                className="w-full"
                href={`/admin/courses/${course.id}`}
              >
                <Settings2 className="mr-2 size-4" />
                Manage course
              </ButtonLink>
            </>
          ) : enrollment ? (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Your progress</span>
                  <span className="text-muted-foreground tabular-nums">
                    {enrollment.progressPct}%
                  </span>
                </div>
                <Progress value={enrollment.progressPct} className="h-2" />
              </div>

              {enrollment.status === 'COMPLETED' && (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="size-4" />
                  Course completed
                </p>
              )}

              <ButtonLink className="w-full" href={`/learn/${course.id}`}>
                {enrollment.progressPct > 0
                  ? 'Continue course'
                  : 'Start course'}
              </ButtonLink>
            </>
          ) : !signedIn ? (
            <>
              <p className="text-muted-foreground text-sm">
                Log in to enrol and track your progress.
              </p>
              <ButtonLink
                className="w-full"
                href={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
              >
                Log in to enrol
              </ButtonLink>
            </>
          ) : (
            <>
              {isArchived && (
                <p className="text-muted-foreground text-sm">
                  This course has been archived and is no longer open for new
                  enrolments.
                </p>
              )}
              {unmetPrerequisites.length > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Lock className="size-3.5" />
                      Prerequisites Required
                    </div>
                    <ul className="mt-1.5 list-inside list-disc space-y-1">
                      {unmetPrerequisites.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full" disabled variant="outline">
                    <Lock className="mr-2 size-4" /> Locked
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={enroll.isPending || isPending || isArchived}
                  onClick={() => enroll.mutate()}
                >
                  {enroll.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Enrol for free
                </Button>
              )}
            </>
          )}

          <dl className="text-muted-foreground space-y-2 border-t pt-4 text-sm">
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Row
                label="Prerequisites"
                value={course.prerequisites
                  .map((p) => {
                    if (p.minGlobalLevel) return `Lvl ${p.minGlobalLevel}`;
                    if (p.minCategoryLevel)
                      return `${p.category?.name ?? 'Skill'} Lvl ${p.minCategoryLevel}`;
                    if (p.prerequisiteCourse)
                      return `Course: ${p.prerequisiteCourse.title}`;
                    return 'Prerequisite';
                  })
                  .join(', ')}
              />
            )}
            <Row label="Modules" value={String(course.moduleCount)} />
            <Row label="Lessons" value={String(course.lessonCount)} />
            {course.totalDurationMin > 0 && (
              <Row
                label="Duration"
                value={formatDuration(course.totalDurationMin)}
              />
            )}
            {course.finalQuiz && (
              <Row
                label="Final exam"
                value={plural(course.finalQuiz.questionCount, 'question')}
              />
            )}
          </dl>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}
