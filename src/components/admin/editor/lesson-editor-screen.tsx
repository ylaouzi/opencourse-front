"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Eye,
  FileText,
  Loader2,
  Pencil,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminCoursesApi,
  adminCurriculumApi,
  uploadsApi,
} from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { useCourseRefresh } from "@/lib/hooks/use-course-refresh";
import type { AdminLesson, ContentType } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonEditor } from "./lesson-editor";

const TYPES: { value: ContentType; label: string; icon: React.ElementType }[] =
  [
    { value: "TEXT", label: "Rich page", icon: FileText },
    { value: "VIDEO", label: "Single video", icon: PlayCircle },
    { value: "FILE", label: "Downloadable file", icon: FileText },
  ];

/** Markup with no text in it — TipTap's empty document is `<p></p>`. */
function hasText(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  );
}

export function LessonEditorScreen({
  courseId,
  moduleId,
  lessonId,
}: {
  courseId: string;
  /** Required when creating; derived from the lesson when editing. */
  moduleId?: string;
  lessonId?: string;
}) {
  const router = useRouter();
  const refresh = useCourseRefresh(courseId);
  const isNew = !lessonId;

  const { data: course, isPending } = useQuery({
    queryKey: ["admin-course", courseId],
    queryFn: () => adminCoursesApi.get(courseId),
  });

  const existing: AdminLesson | undefined = course?.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === lessonId);

  const parentModule = course?.modules.find((m) =>
    isNew ? m.id === moduleId : m.lessons.some((l) => l.id === lessonId),
  );

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<ContentType>("TEXT");
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState("");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);

  // Load the lesson into the form once it arrives.
  const loadedId = existing?.id ?? (isNew ? "new" : undefined);
  const [loadedFor, setLoadedFor] = useState<string>();
  if (loadedId && loadedFor !== loadedId) {
    setLoadedFor(loadedId);
    setTitle(existing?.title ?? "");
    setContentType(existing?.contentType ?? "TEXT");
    setContent(existing?.content ?? "");
    setDuration(existing?.durationMin ? String(existing.durationMin) : "");
    setDirty(false);
  }

  // Leaving with unsaved work should take a deliberate confirmation.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const uploadImage = async (file: File) => {
    try {
      const { url } = await uploadsApi.image(file);
      return url;
    } catch (error) {
      toast.error(errorMessage(error, "Could not upload that image"));
      throw error;
    }
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: title.trim(),
        contentType,
        content: content.trim(),
        durationMin: duration ? Number(duration) : undefined,
      };

      return existing
        ? adminCurriculumApi.updateLesson(existing.id, payload)
        : adminCurriculumApi.createLesson(moduleId!, payload);
    },
    onSuccess: async (saved: AdminLesson) => {
      await refresh();
      setDirty(false);
      toast.success(existing ? "Lesson saved" : "Lesson created");
      if (!existing) {
        router.replace(`/admin/courses/${courseId}/lessons/${saved.id}`);
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => adminCurriculumApi.deleteLesson(existing!.id),
    onSuccess: async () => {
      await refresh();
      setDirty(false);
      toast.success("Lesson deleted");
      router.push(`/admin/courses/${courseId}`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const [scrolledFar, setScrolledFar] = useState(false);

  // Track scroll position for floating back-to-top / quick-save dock
  useEffect(() => {
    const onScroll = () => {
      setScrolledFar(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const contentReady =
    contentType === "TEXT" ? hasText(content) : content.trim().length > 0;
  const canSave = title.trim().length >= 2 && contentReady && !save.isPending;

  // Ctrl+S / Cmd+S save shortcut — writers shouldn't need to reach for the mouse
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canSave) {
          save.mutate();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canSave, save]);

  const change =
    <T,>(setter: (v: T) => void) =>
    (value: T) => {
      setter(value);
      setDirty(true);
    };

  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  const wordCount =
    plainText.length > 0 ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!isNew && !existing) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Lesson not found</h1>
        <ButtonLink className="mt-6" href={`/admin/courses/${courseId}`}>
          Back to the course
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sticky action bar — docked directly under AdminHeader with zero gap */}
      <header className="bg-background/95 sticky top-14 z-30 -mt-8 -mx-4 sm:-mx-6 border-b px-4 sm:px-6 py-2.5 shadow-xs backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {/* Left: Navigation and Breadcrumbs */}
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (
                  dirty &&
                  !confirm("You have unsaved changes. Leave without saving?")
                )
                  return;
                router.push(`/admin/courses/${courseId}`);
              }}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              <span className="hidden sm:inline">{course?.title ?? "Course"}</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <span className="text-muted-foreground/50 hidden text-xs sm:inline">/</span>

            {parentModule && (
              <span className="text-muted-foreground hidden text-xs font-medium sm:inline shrink-0">
                Module {parentModule.position}
              </span>
            )}

            <span className="text-muted-foreground/50 hidden text-xs md:inline">/</span>

            {/* Truncated Lesson title preview so author always knows what is being edited */}
            <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px] text-foreground">
              {title.trim() || (isNew ? "New lesson" : "Untitled lesson")}
            </span>
          </div>

          {/* Right: Actions, Dirty State, Word count, Preview, Save */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Word count & Reading time for rich text */}
            {contentType === "TEXT" && wordCount > 0 && (
              <span className="text-muted-foreground hidden lg:inline-flex items-center text-xs bg-muted/60 px-2.5 py-0.5 rounded-full font-medium">
                {wordCount} {wordCount === 1 ? "word" : "words"} · ~{readTime} min read
              </span>
            )}

            {/* Dirty / Saved indicator */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {dirty ? (
                <span className="text-warning flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-warning animate-pulse" />
                  <span className="hidden xs:inline">Unsaved</span>
                </span>
              ) : save.isSuccess ? (
                <span className="text-success flex items-center gap-1">
                  <Check className="size-3.5" />
                  <span className="hidden xs:inline">Saved</span>
                </span>
              ) : null}
            </div>

            {contentType === "TEXT" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreview((p) => !p)}
              >
                {preview ? (
                  <>
                    <Pencil className="mr-1.5 size-3.5" /> Edit
                  </>
                ) : (
                  <>
                    <Eye className="mr-1.5 size-3.5" /> Preview
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              disabled={!canSave}
              onClick={() => save.mutate()}
              title="Save changes (Ctrl+S)"
            >
              {save.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 size-3.5" />
              )}
              <span>{existing ? "Save" : "Create lesson"}</span>
              <kbd className="text-[10px] opacity-60 hidden sm:inline ml-1 font-mono">
                Ctrl+S
              </kbd>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <input
            value={title}
            onChange={(e) => change(setTitle)(e.target.value)}
            placeholder="Lesson title"
            aria-label="Lesson title"
            className="placeholder:text-muted-foreground/50 mb-4 w-full border-0 bg-transparent text-3xl font-bold tracking-tight focus:outline-none"
          />

          {contentType === "TEXT" ? (
            preview ? (
              <div className="bg-card rounded-lg border">
                <p className="text-muted-foreground border-b px-6 py-2 text-xs">
                  Preview — this is what a learner sees
                </p>
                <div
                  className="lesson-prose px-6 py-8 sm:px-10"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            ) : (
              <LessonEditor
                value={content}
                onChange={change(setContent)}
                onUploadImage={uploadImage}
              />
            )
          ) : (
            <div className="bg-card space-y-2 rounded-lg border p-6">
              <Label htmlFor="lesson-url">
                {contentType === "VIDEO" ? "Video URL" : "File URL"}
              </Label>
              <Input
                id="lesson-url"
                value={content}
                onChange={(e) => change(setContent)(e.target.value)}
                placeholder="https://…"
              />
              <p className="text-muted-foreground text-xs">
                {contentType === "VIDEO"
                  ? "YouTube and Vimeo links are embedded; direct .mp4/.webm files play inline."
                  : "Learners get a download link. Upload the file first, then paste its URL."}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[124px] lg:self-start">
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-sm font-medium">Lesson type</h2>
            <div className="mt-3 space-y-1">
              {TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={contentType === value}
                  onClick={() => change(setContentType)(value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    contentType === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
            {contentType === "TEXT" && (
              <p className="text-muted-foreground mt-3 text-xs">
                A rich page can contain images, embedded video and tables.
              </p>
            )}
          </div>

          <div className="bg-card space-y-2 rounded-lg border p-4">
            <Label htmlFor="lesson-duration" className="text-sm">
              Duration (minutes)
            </Label>
            <Input
              id="lesson-duration"
              type="number"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => change(setDuration)(e.target.value)}
              className="w-24"
            />
            <p className="text-muted-foreground text-xs">
              Shown in the curriculum and totalled on the course card.
            </p>
          </div>

          {existing && (
            <div className="border-destructive/30 rounded-lg border p-4">
              <h2 className="text-sm font-medium">Delete lesson</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Removes it for everyone and recalculates course progress.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3 w-full"
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm(`Delete "${existing.title}"?`)) remove.mutate();
                }}
              >
                <Trash2 className="mr-1.5 size-3.5" /> Delete
              </Button>
            </div>
          )}
        </aside>
      </div>

      {/* Floating dock when scrolled deep down in long content */}
      {scrolledFar && (
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {dirty && (
            <Button
              size="sm"
              disabled={!canSave}
              onClick={() => save.mutate()}
              className="shadow-lifted font-medium"
              title="Save changes (Ctrl+S)"
            >
              {save.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 size-3.5" />
              )}
              Save
            </Button>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            className="bg-background/90 shadow-lifted backdrop-blur hover:bg-background"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
