'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Clock, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { lessonsApi } from '@/lib/api/endpoints';
import { errorMessage, errorStatus } from '@/lib/api/client';
import { formatDuration } from '@/lib/format';
import { useApplyProgress, usePlayer } from '@/lib/hooks/use-player';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { LessonContent } from '@/components/learn/lesson-content';

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const applyProgress = useApplyProgress(courseId);
  const { data: player } = usePlayer(courseId);

  const {
    data: lesson,
    isPending,
    error,
  } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonsApi.read(lessonId),
  });

  const setComplete = useMutation({
    mutationFn: (completed: boolean) =>
      completed
        ? lessonsApi.complete(lessonId)
        : lessonsApi.uncomplete(lessonId),
    onSuccess: (update, completed) => {
      // The response carries a fresh snapshot; write it straight into the
      // sidebar's cache instead of refetching the whole player payload.
      applyProgress(update);
      queryClient.setQueryData(['lesson', lessonId], (old: typeof lesson) =>
        old ? { ...old, completed } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });

      if (!completed) return;

      const next = update.progress.nextUp;
      if (next) {
        router.push(
          next.kind === 'lesson'
            ? `/learn/${courseId}/lessons/${next.id}`
            : `/learn/${courseId}/quizzes/${next.id}`,
        );
      } else if (update.progress.isComplete) {
        toast.success('Course complete');
        router.push(`/learn/${courseId}`);
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    const locked = errorStatus(error) === 403;
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">
          {locked ? 'This lesson is locked' : 'Could not load this lesson'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {errorMessage(error)}
        </p>
        <ButtonLink className="mt-6" href={`/learn/${courseId}`}>
          Go to what is next
        </ButtonLink>
      </div>
    );
  }

  const moduleTitle = player?.modules.find((m) =>
    m.lessons.some((l) => l.id === lessonId),
  )?.title;

  return (
    <article className="px-6 py-10 lg:px-12">
      <p className="text-muted-foreground text-sm">
        {moduleTitle ?? lesson.module.title}
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance">
        {lesson.title}
      </h1>

      {lesson.durationMin && (
        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
          <Clock className="size-3.5" />
          {formatDuration(lesson.durationMin)}
        </p>
      )}

      <div className="mt-8">
        <LessonContent lesson={lesson} />
      </div>

      <footer className="mt-12 flex flex-wrap items-center gap-3 border-t pt-6">
        {lesson.completed ? (
          <>
            <span className="flex items-center gap-2 text-sm text-success">
              <Check className="size-4" /> Completed
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={setComplete.isPending}
              onClick={() => setComplete.mutate(false)}
            >
              <Undo2 className="mr-1.5 size-3.5" /> Mark as not done
            </Button>
          </>
        ) : (
          <Button
            disabled={setComplete.isPending}
            onClick={() => setComplete.mutate(true)}
          >
            {setComplete.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Mark as complete
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </footer>
    </article>
  );
}
