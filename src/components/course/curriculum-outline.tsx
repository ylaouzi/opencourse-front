import { FileText, ListChecks, Lock, PlayCircle, Trophy } from 'lucide-react';
import type { ContentType, CourseDetail } from '@/lib/types/api';
import { formatDuration, plural } from '@/lib/format';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const CONTENT_ICON: Record<ContentType, React.ElementType> = {
  TEXT: FileText,
  VIDEO: PlayCircle,
  FILE: FileText,
};

/**
 * Titles are public, bodies are not — the API's outline payload carries no
 * lesson content and no quiz questions, only counts. Showing the shape of the
 * course is what convinces someone to enrol; the padlock says the rest is
 * behind it.
 */
export function CurriculumOutline({ course }: { course: CourseDetail }) {
  return (
    <Accordion
      // First module open so the page never looks empty on arrival.
      defaultValue={course.modules[0] ? [course.modules[0].id] : []}
      className="divide-y rounded-lg border"
    >
      {course.modules.map((module) => (
        <AccordionItem key={module.id} value={module.id} className="px-4">
          <AccordionTrigger className="py-4 text-left hover:no-underline">
            <div className="flex flex-1 items-center gap-3 pr-3">
              <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums">
                {module.position}
              </span>
              <span className="flex-1 font-medium">{module.title}</span>
              <span className="text-muted-foreground hidden text-xs sm:inline">
                {plural(module.lessonCount, 'lesson')}
                {module.durationMin > 0 &&
                  ` · ${formatDuration(module.durationMin)}`}
              </span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pb-4">
            <ul className="space-y-1">
              {module.lessons.map((lesson) => {
                const Icon = CONTENT_ICON[lesson.contentType];
                return (
                  <li
                    key={lesson.id}
                    className="text-muted-foreground flex items-center gap-3 rounded-md px-2 py-2 text-sm"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{lesson.title}</span>
                    {lesson.durationMin && (
                      <span className="text-xs tabular-nums">
                        {formatDuration(lesson.durationMin)}
                      </span>
                    )}
                    <Lock className="size-3.5 shrink-0 opacity-40" />
                  </li>
                );
              })}

              {module.quiz && (
                <li className="text-muted-foreground flex items-center gap-3 rounded-md px-2 py-2 text-sm">
                  <ListChecks className="size-4 shrink-0" />
                  <span className="flex-1">
                    Module quiz —{' '}
                    {plural(module.quiz.questionCount, 'question')}
                  </span>
                  <span className="text-xs">
                    pass {module.quiz.passScore}%
                  </span>
                  <Lock className="size-3.5 shrink-0 opacity-40" />
                </li>
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}

      {course.finalQuiz && (
        <div className="flex items-center gap-3 px-4 py-4 text-sm">
          <Trophy className="text-primary size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Final exam</p>
            <p className="text-muted-foreground text-xs">
              {plural(course.finalQuiz.questionCount, 'question')} · pass{' '}
              {course.finalQuiz.passScore}% to complete the course
            </p>
          </div>
          <Lock className="text-muted-foreground size-3.5 shrink-0 opacity-40" />
        </div>
      )}
    </Accordion>
  );
}
