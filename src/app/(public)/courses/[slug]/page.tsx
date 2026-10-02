import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BookOpen, Clock, Layers, Signal, Users } from 'lucide-react';
import { ApiError, serverFetch } from '@/lib/api/server';
import type { CourseDetail } from '@/lib/types/api';
import {
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  formatDuration,
  plural,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CurriculumOutline } from '@/components/course/curriculum-outline';
import { EnrollPanel } from '@/components/course/enroll-panel';

type Params = { params: Promise<{ slug: string }> };

async function getCourse(slug: string): Promise<CourseDetail> {
  try {
    return await serverFetch<CourseDetail>(`/courses/${slug}`);
  } catch (error) {
    // The API 404s for drafts and for archived courses the visitor is not
    // enrolled in — both are "does not exist" from out here.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  try {
    const course = await serverFetch<CourseDetail>(`/courses/${slug}`);
    return {
      title: course.title,
      description: course.description.slice(0, 160),
    };
  } catch {
    return { title: 'Course not found' };
  }
}

export default async function CourseDetailPage({ params }: Params) {
  const { slug } = await params;
  const course = await getCourse(slug);

  const stats = [
    { icon: Layers, label: plural(course.moduleCount, 'module') },
    { icon: BookOpen, label: plural(course.lessonCount, 'lesson') },
    {
      icon: Clock,
      label:
        course.totalDurationMin > 0
          ? formatDuration(course.totalDurationMin)
          : 'Self-paced',
    },
    { icon: Signal, label: DIFFICULTY_LABEL[course.difficulty] },
    { icon: Users, label: plural(course.enrollmentCount, 'learner') },
  ];

  return (
    <>
      <section className="bg-muted/30 border-b">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn('border-0', DIFFICULTY_CLASS[course.difficulty])}
              >
                {DIFFICULTY_LABEL[course.difficulty]}
              </Badge>
              {course.category && (
                <Badge variant="outline">{course.category.name}</Badge>
              )}
              {course.status === 'ARCHIVED' && (
                <Badge variant="outline" className="text-warning">
                  Archived
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {course.title}
            </h1>

            <p className="text-muted-foreground mt-4 max-w-2xl text-lg text-pretty">
              {course.description}
            </p>

            <dl className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {stats.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="size-4" />
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>

            <p className="text-muted-foreground mt-6 text-sm">
              Created by{' '}
              <span className="text-foreground font-medium">
                {course.admin.name}
              </span>
            </p>
          </div>

          <EnrollPanel course={course} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Curriculum
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {plural(course.moduleCount, 'module')} ·{' '}
              {plural(course.lessonCount, 'lesson')}
              {course.finalQuiz ? ' · final exam' : ''}
            </p>

            <div className="mt-6">
              <CurriculumOutline course={course} />
            </div>
          </div>

          {course.admin.bio && (
            <aside className="lg:pt-16">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="font-semibold">About the instructor</h3>
                <p className="mt-1 font-medium">{course.admin.name}</p>
                <p className="text-muted-foreground mt-3 text-sm">
                  {course.admin.bio}
                </p>
              </div>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
