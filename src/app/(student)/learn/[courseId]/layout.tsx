"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ListTree, Loader2 } from "lucide-react";
import { usePlayer } from "@/lib/hooks/use-player";
import { errorMessage, errorStatus } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { LessonSidebar } from "@/components/learn/lesson-sidebar";
import { ButtonLink } from "@/components/ui/button-link";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: player, isPending, error } = usePlayer(courseId);
  const [navOpen, setNavOpen] = useState(false);

  if (isPending) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    // 403 means not enrolled — the API is the authority, so say so plainly
    // rather than pretending the course does not exist.
    const notEnrolled = errorStatus(error) === 403;

    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">
          {notEnrolled
            ? "You are not enrolled in this course"
            : "Something went wrong"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {notEnrolled
            ? "Enrol from the course page to start learning."
            : errorMessage(error)}
        </p>
        <ButtonLink className="mt-6" href="/courses">
          Browse courses
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r lg:block">
        <LessonSidebar player={player} />
      </aside>

      <div className="min-w-0 flex-1">
        {/* Below lg the sidebar is hidden, so the curriculum needs its own way
            in — without this a learner on a phone cannot move between lessons
            at all. */}
        <div className="bg-background/80 sticky top-16 z-30 flex items-center gap-3 border-b px-4 py-2 backdrop-blur lg:hidden">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ListTree className="mr-2 size-4" />
              Curriculum
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Course curriculum</SheetTitle>
              </SheetHeader>
              {/* Closing on navigation happens in the click handler rather
                  than an effect watching the pathname. */}
              <LessonSidebar
                player={player}
                onNavigate={() => setNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <span className="text-muted-foreground truncate text-xs">
            {player.progress.progressPct}% · {player.progress.done}/
            {player.progress.units} steps
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}
