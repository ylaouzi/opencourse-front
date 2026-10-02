"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  FileText,
  ListChecks,
  Lock,
  PlayCircle,
  Trophy,
} from "lucide-react";
import type { ContentType, PlayerPayload } from "@/lib/types/api";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const CONTENT_ICON: Record<ContentType, React.ElementType> = {
  TEXT: FileText,
  VIDEO: PlayCircle,
  FILE: FileText,
};

/**
 * Mirrors the locks the API enforces. It is a view of the server's snapshot,
 * never its own judgement — every locked link here would also 403.
 */
export function LessonSidebar({
  player,
  onNavigate,
}: {
  player: PlayerPayload;
  /** Fired when a row is followed — lets the mobile drawer close itself. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const courseId = player.course.id;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Link
          href={`/courses/${player.course.slug}`}
          className="hover:text-primary text-sm font-semibold"
        >
          {player.course.title}
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={player.progress.progressPct}
            className="h-1.5 flex-1"
          />
          <span className="text-muted-foreground text-xs tabular-nums">
            {player.progress.progressPct}%
          </span>
        </div>
        <p className="text-muted-foreground mt-1.5 text-xs">
          {player.progress.done} of {player.progress.units} steps complete
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {player.modules.map((module) => (
          <section key={module.id} className="mb-4">
            <header className="flex items-center gap-2 px-2 py-1.5">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium tabular-nums",
                  module.completed
                    ? "bg-success text-background"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {module.completed ? (
                  <Check className="size-3" />
                ) : (
                  module.position
                )}
              </span>
              <h2
                className={cn(
                  "flex-1 text-xs font-medium tracking-wide uppercase",
                  module.unlocked
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50",
                )}
              >
                {module.title}
              </h2>
              {!module.unlocked && (
                <Lock className="text-muted-foreground/50 size-3" />
              )}
            </header>

            <ul>
              {module.lessons.map((lesson) => {
                const href = `/learn/${courseId}/lessons/${lesson.id}`;
                const active = pathname === href;
                const Icon = CONTENT_ICON[lesson.contentType ?? "TEXT"];

                return (
                  <li key={lesson.id}>
                    <SidebarRow
                      onNavigate={onNavigate}
                      href={module.unlocked ? href : undefined}
                      active={active}
                      done={lesson.completed}
                      icon={Icon}
                      label={lesson.title}
                      meta={
                        lesson.durationMin
                          ? formatDuration(lesson.durationMin)
                          : undefined
                      }
                    />
                  </li>
                );
              })}

              {module.quiz && (
                <li>
                  <SidebarRow
                    onNavigate={onNavigate}
                    href={
                      module.quiz.unlocked
                        ? `/learn/${courseId}/quizzes/${module.quiz.id}`
                        : undefined
                    }
                    active={pathname.endsWith(`/quizzes/${module.quiz.id}`)}
                    done={module.quiz.passed}
                    icon={ListChecks}
                    label="Module quiz"
                    meta={
                      module.quiz.bestScore !== null
                        ? `${module.quiz.bestScore}%`
                        : `pass ${module.quiz.passScore}%`
                    }
                  />
                </li>
              )}
            </ul>
          </section>
        ))}

        {player.finalQuiz && (
          <section className="mt-2 border-t pt-3">
            <SidebarRow
              onNavigate={onNavigate}
              href={
                player.finalQuiz.unlocked
                  ? `/learn/${courseId}/quizzes/${player.finalQuiz.id}`
                  : undefined
              }
              active={pathname.endsWith(`/quizzes/${player.finalQuiz.id}`)}
              done={player.finalQuiz.passed}
              icon={Trophy}
              label="Final exam"
              meta={
                player.finalQuiz.bestScore !== null
                  ? `${player.finalQuiz.bestScore}%`
                  : `pass ${player.finalQuiz.passScore}%`
              }
            />
          </section>
        )}
      </nav>
    </div>
  );
}

function SidebarRow({
  href,
  active,
  done,
  icon: Icon,
  label,
  meta,
  onNavigate,
}: {
  href?: string;
  active: boolean;
  done: boolean;
  icon: React.ElementType;
  label: string;
  meta?: string;
  onNavigate?: () => void;
}) {
  const inner = (
    <>
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          done
            ? "border-success bg-success text-background"
            : "border-muted-foreground/30",
        )}
      >
        {done && <Check className="size-2.5" />}
      </span>
      <Icon className="size-3.5 shrink-0 opacity-60" />
      <span className="flex-1 truncate">{label}</span>
      {meta && (
        <span className="shrink-0 text-xs tabular-nums opacity-60">{meta}</span>
      )}
      {!href && <Lock className="size-3 shrink-0 opacity-40" />}
    </>
  );

  const className = cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
    active && "bg-primary/10 text-primary font-medium",
    !href && "text-muted-foreground/50 cursor-not-allowed",
    href && !active && "hover:bg-muted text-foreground/80",
  );

  // Locked rows stay visible but are not links — the shape of the course is
  // useful information even before you can reach it.
  if (!href) {
    return (
      <div className={className} aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {inner}
    </Link>
  );
}
