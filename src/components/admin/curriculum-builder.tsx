"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  PlayCircle,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { adminCurriculumApi } from "@/lib/api/endpoints";
import { useCourseRefresh } from "@/lib/hooks/use-course-refresh";
import { errorMessage } from "@/lib/api/client";
import type {
  AdminCourseTree,
  AdminModule,
  ContentType,
} from "@/lib/types/api";
import { formatDuration, plural } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button-link";
import { QuizDialog } from "./quiz-dialog";

const CONTENT_ICON: Record<ContentType, React.ElementType> = {
  TEXT: FileText,
  VIDEO: PlayCircle,
  FILE: FileText,
};

export function CurriculumBuilder({ course }: { course: AdminCourseTree }) {
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const refresh = useCourseRefresh(course.id);

  const addModule = useMutation({
    mutationFn: (title: string) =>
      adminCurriculumApi.createModule(course.id, title),
    onSuccess: async () => {
      setNewModuleTitle("");
      await refresh();
      toast.success("Module added");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const reorderModules = useMutation({
    mutationFn: (orderedIds: string[]) =>
      adminCurriculumApi.reorderModules(course.id, orderedIds),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const moveModule = (index: number, direction: -1 | 1) => {
    const ids = course.modules.map((m) => m.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderModules.mutate(ids);
  };

  return (
    <div className="space-y-4">
      {course.modules.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No modules yet. Add the first one below.
        </p>
      )}

      {course.modules.map((module, index) => (
        <ModuleCard
          key={module.id}
          module={module}
          courseId={course.id}
          isFirst={index === 0}
          isLast={index === course.modules.length - 1}
          reordering={reorderModules.isPending}
          onMove={(direction) => moveModule(index, direction)}
        />
      ))}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newModuleTitle.trim()) addModule.mutate(newModuleTitle.trim());
        }}
      >
        <Input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="New module title…"
          aria-label="New module title"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!newModuleTitle.trim() || addModule.isPending}
        >
          {addModule.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          Add module
        </Button>
      </form>

      <FinalQuizRow course={course} />
    </div>
  );
}

function ModuleCard({
  module,
  courseId,
  isFirst,
  isLast,
  reordering,
  onMove,
}: {
  module: AdminModule;
  courseId: string;
  isFirst: boolean;
  isLast: boolean;
  reordering: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  const refresh = useCourseRefresh(courseId);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [quizOpen, setQuizOpen] = useState(false);

  const rename = useMutation({
    mutationFn: () => adminCurriculumApi.updateModule(module.id, title.trim()),
    onSuccess: async () => {
      setRenaming(false);
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => adminCurriculumApi.deleteModule(module.id),
    onSuccess: async (result: { affectedEnrollments?: number }) => {
      await refresh();
      toast.success(
        result?.affectedEnrollments
          ? `Module deleted — progress recalculated for ${plural(result.affectedEnrollments, "learner")}`
          : "Module deleted",
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const removeLesson = useMutation({
    mutationFn: (lessonId: string) => adminCurriculumApi.deleteLesson(lessonId),
    onSuccess: async () => {
      await refresh();
      toast.success("Lesson deleted");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const reorderLessons = useMutation({
    mutationFn: (orderedIds: string[]) =>
      adminCurriculumApi.reorderLessons(module.id, orderedIds),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const moveLesson = (index: number, direction: -1 | 1) => {
    const ids = module.lessons.map((l) => l.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderLessons.mutate(ids);
  };

  return (
    <div className="bg-card rounded-lg border">
      <div className="flex items-center gap-3 border-b p-4">
        <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums">
          {module.position}
        </span>

        {renaming ? (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              rename.mutate();
            }}
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              aria-label="Module title"
            />
            <Button type="submit" size="sm" disabled={rename.isPending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setTitle(module.title);
                setRenaming(false);
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <h3 className="flex-1 font-medium">{module.title}</h3>
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {plural(module.lessons.length, "lesson")}
              {module.quiz ? " · quiz" : ""}
            </span>

            {/* Up/down rather than drag-and-drop: keyboard accessible, works
                on touch, and hits the same reorder endpoint. */}
            <div className="flex">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isFirst || reordering}
                onClick={() => onMove(-1)}
                aria-label="Move module up"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isLast || reordering}
                onClick={() => onMove(1)}
                aria-label="Move module down"
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setRenaming(true)}
                aria-label="Rename module"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={remove.isPending}
                onClick={() => {
                  if (
                    confirm(`Delete module "${module.title}" and its lessons?`)
                  )
                    remove.mutate();
                }}
                aria-label="Delete module"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>

      <ul className="divide-y">
        {module.lessons.map((lesson, index) => {
          const Icon = CONTENT_ICON[lesson.contentType];
          return (
            <li
              key={lesson.id}
              className="hover:bg-muted/30 flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <Icon className="text-muted-foreground size-4 shrink-0" />
              <span className="flex-1 truncate">{lesson.title}</span>
              {lesson.durationMin && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatDuration(lesson.durationMin)}
                </span>
              )}
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0 || reorderLessons.isPending}
                  onClick={() => moveLesson(index, -1)}
                  aria-label="Move lesson up"
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={
                    index === module.lessons.length - 1 ||
                    reorderLessons.isPending
                  }
                  onClick={() => moveLesson(index, 1)}
                  aria-label="Move lesson down"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <ButtonLink
                  variant="ghost"
                  size="icon-sm"
                  href={`/admin/courses/${courseId}/lessons/${lesson.id}`}
                  aria-label="Edit lesson"
                >
                  <Pencil className="size-3.5" />
                </ButtonLink>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    if (confirm(`Delete lesson "${lesson.title}"?`))
                      removeLesson.mutate(lesson.id);
                  }}
                  aria-label="Delete lesson"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2 p-3">
        <ButtonLink
          variant="outline"
          size="sm"
          href={`/admin/courses/${courseId}/lessons/new?moduleId=${module.id}`}
        >
          <Plus className="mr-1.5 size-3.5" /> Add lesson
        </ButtonLink>

        <Button variant="outline" size="sm" onClick={() => setQuizOpen(true)}>
          <ListChecks className="mr-1.5 size-3.5" />
          {module.quiz
            ? `Edit quiz (${plural(module.quiz.questions.length, "question")})`
            : "Add quiz"}
        </Button>
      </div>

      <QuizDialog
        open={quizOpen}
        onOpenChange={setQuizOpen}
        quiz={module.quiz}
        courseId={courseId}
        moduleId={module.id}
        title={`Quiz — ${module.title}`}
      />
    </div>
  );
}

function FinalQuizRow({ course }: { course: AdminCourseTree }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-card flex items-center gap-3 rounded-lg border p-4">
        <Trophy className="text-primary size-5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Final exam</p>
          <p className="text-muted-foreground text-xs">
            {course.finalQuiz
              ? `${plural(course.finalQuiz.questions.length, "question")} · pass ${course.finalQuiz.passScore}%`
              : "Optional. Completing it is what finishes the course."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {course.finalQuiz ? "Edit" : "Add final exam"}
        </Button>
      </div>

      <QuizDialog
        open={open}
        onOpenChange={setOpen}
        quiz={course.finalQuiz}
        courseId={course.id}
        title="Final exam"
      />
    </>
  );
}
