'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { AdminNavList } from './admin-nav';

/**
 * The admin console's own chrome.
 *
 * Admin used to run inside the learner shell — the same SiteHeader, carrying
 * "Courses / Dashboard / My courses" — with a small admin rail bolted
 * underneath it. That put two competing navigations on screen and made the
 * console read as a student page with extra pages attached. Admin is a
 * different job, so it gets a different room: its own sidebar, its own header,
 * and one deliberate door back to the learner site.
 */
export function AdminSidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-4">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
        >
          <LogoMark className="size-7 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm leading-tight font-semibold">
              OpenCourse
            </span>
            <span className="text-muted-foreground block text-xs leading-tight">
              Admin console
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3" aria-label="Admin sections">
        <AdminNavList onNavigate={onNavigate} />
      </nav>

      {/* The way back to the learner site. Deliberate and singular, rather than
          student links living permanently in the admin chrome. */}
      <div className="border-t px-3 py-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-muted-foreground hover:bg-surface-raised hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-[--dur-fast]"
        >
          <ArrowUpRight className="size-4 shrink-0" />
          View site
        </Link>
      </div>
    </div>
  );
}

/** Desktop rail. Below lg the same content is served in a sheet by AdminHeader. */
export function AdminSidebar() {
  return (
    <aside className="bg-surface-sunken sticky top-0 hidden h-screen w-60 shrink-0 border-r lg:block">
      <AdminSidebarContent />
    </aside>
  );
}
