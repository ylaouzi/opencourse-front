'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookMarked, LayoutDashboard, Tags, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Overview would otherwise match every /admin/* route. */
  exact?: boolean;
}

/**
 * The admin console's own sections — the only navigation an admin gets while
 * they are in here. Course catalog / Dashboard / My courses belong to the
 * learner site and are reached deliberately through "View site", not by
 * sitting permanently in the admin chrome.
 */
export const ADMIN_LINKS: AdminLink[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/courses', label: 'Courses', icon: BookMarked },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  // Previously unreachable from the nav: /admin/users existed but was only
  // linked from a sentence on the overview page.
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {ADMIN_LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);

        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                'transition-colors duration-[--dur-fast] ease-[--ease-out-soft]',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground',
              )}
            >
              {/* Colour alone never carries state (plan §10): the active item
                  also gets a rail marker. */}
              <span
                className={cn(
                  'absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity',
                  active ? 'bg-primary opacity-100' : 'opacity-0',
                )}
              />
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
