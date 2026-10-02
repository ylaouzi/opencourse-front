'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Trophy } from 'lucide-react';
import { usePlayer } from '@/lib/hooks/use-player';
import { ButtonLink } from '@/components/ui/button-link';

/**
 * The Resume entry point. The server already computed what comes next, so this
 * just follows `nextUp` rather than reimplementing the unlocking rules.
 */
export default function LearnIndexPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { data: player } = usePlayer(courseId);

  const nextUp = player?.progress.nextUp;
  const lastLessonId = player?.enrollment.lastLessonId;

  useEffect(() => {
    if (!player) return;

    // Prefer the lesson they were last reading; fall back to what the server
    // says is next.
    if (lastLessonId && !player.progress.isComplete) {
      router.replace(`/learn/${courseId}/lessons/${lastLessonId}`);
      return;
    }

    if (!nextUp) return;

    router.replace(
      nextUp.kind === 'lesson'
        ? `/learn/${courseId}/lessons/${nextUp.id}`
        : `/learn/${courseId}/quizzes/${nextUp.id}`,
    );
  }, [player, nextUp, lastLessonId, courseId, router]);

  if (player?.progress.isComplete) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <Trophy className="text-primary mx-auto size-12" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          You finished {player.course.title}
        </h1>
        <p className="text-muted-foreground mt-3">
          Every lesson done and every quiz passed. Revisit any lesson from the
          sidebar whenever you like.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/certificates/${courseId}`}>
            View your certificate
          </ButtonLink>
          <ButtonLink variant="outline" href="/my-courses">
            Back to my courses
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}
