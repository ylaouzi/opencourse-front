import Link from 'next/link';
import { BookOpen, Clock, Layers, Users } from 'lucide-react';
import type { CourseCard as CourseCardType } from '@/lib/types/api';
import {
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  formatDuration,
  plural,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CourseCover } from './course-cover';

export function CourseCard({ course }: { course: CourseCardType }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        'group focus-visible:ring-ring bg-surface-raised flex flex-col overflow-hidden rounded-xl border',
        'shadow-raised transition-[transform,box-shadow] duration-[--dur-base] ease-[--ease-out-soft]',
        'hover:-translate-y-1 hover:shadow-lifted focus-visible:ring-2 focus-visible:outline-none',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      )}
    >
      <div className="relative">
        <CourseCover
          src={course.coverUrl}
          seed={course.id}
          title={course.title}
          className="aspect-[16/9]"
        />

        {course.enrolled && (
          <span className="bg-surface-raised text-foreground shadow-raised absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium">
            Enrolled
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn('border-0', DIFFICULTY_CLASS[course.difficulty])}
          >
            {DIFFICULTY_LABEL[course.difficulty]}
          </Badge>
          {course.category && (
            <Badge variant="outline">{course.category.name}</Badge>
          )}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] gap-1"
            >
              🔒 Gated
            </Badge>
          )}
        </div>

        <h3 className="group-hover:text-primary font-semibold text-balance transition-colors">
          {course.title}
        </h3>

        <p className="text-muted-foreground line-clamp-2 flex-1 text-sm">
          {course.description}
        </p>

        <dl className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5" />
            <dd>{plural(course.moduleCount, 'module')}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            <dd>{plural(course.lessonCount, 'lesson')}</dd>
          </div>
          {course.totalDurationMin > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <dd>{formatDuration(course.totalDurationMin)}</dd>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <Users className="size-3.5" />
            <dd>{course.enrollmentCount}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted aspect-[16/9] animate-pulse" />
      <div className="space-y-3 p-4">
        <div className="bg-muted h-5 w-24 animate-pulse rounded" />
        <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-4 w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
      </div>
    </div>
  );
}
