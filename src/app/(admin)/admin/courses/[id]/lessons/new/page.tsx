'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LessonEditorScreen } from '@/components/admin/editor/lesson-editor-screen';
import { ButtonLink } from '@/components/ui/button-link';

function NewLesson() {
  const { id } = useParams<{ id: string }>();
  const moduleId = useSearchParams().get('moduleId');

  // A lesson has to belong to a module; arriving without one is a broken link
  // rather than a state worth guessing at.
  if (!moduleId) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Which module?</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Start a new lesson from the module you want it in.
        </p>
        <ButtonLink className="mt-6" href={`/admin/courses/${id}`}>
          Back to the course
        </ButtonLink>
      </div>
    );
  }

  return <LessonEditorScreen courseId={id} moduleId={moduleId} />;
}

export default function NewLessonPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <NewLesson />
    </Suspense>
  );
}
