'use client';

import { useParams } from 'next/navigation';
import { LessonEditorScreen } from '@/components/admin/editor/lesson-editor-screen';

export default function EditLessonPage() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();

  return <LessonEditorScreen courseId={id} lessonId={lessonId} />;
}
