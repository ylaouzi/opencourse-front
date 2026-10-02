'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { AdminSidebarContent } from './admin-sidebar';

/**
 * Admin's own top bar. Deliberately thin: navigation lives in the sidebar, so
 * this carries only the mobile nav trigger, the theme toggle and the account
 * menu — and that account menu offers admin-appropriate destinations rather
 * than the learner ones.
 */
export function AdminHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    signOut();
    // Full navigation, not router.push: it beats AuthGuard's redirect on the
    // page being left and drops the TanStack Query cache, so the next user
    // never sees the previous one's data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload, see above
    window.location.assign('/');
  };

  return (
    <header className="bg-surface-bar/85 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        {/* The rail is lg-only, so below that the admin sections need a home.
            It serves the ADMIN nav — not the learner one the old shell used. */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
              'lg:hidden',
            )}
            aria-label="Open admin menu"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="bg-surface-sunken w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin menu</SheetTitle>
            </SheetHeader>
            <AdminSidebarContent onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <span className="text-sm font-semibold lg:hidden">Admin console</span>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {user && (
            <DropdownMenu>
              {/* buttonVariants rather than a nested <Button>: Menu.Trigger is
                  already a Base UI button, and nesting two leaves it inert. */}
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'h-auto gap-2 px-2 py-1',
                )}
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Base UI requires GroupLabel inside a Group — without this
                    the whole menu throws on open. */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <UserIcon className="mr-2 size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/" />}>
                  <ArrowUpRight className="mr-2 size-4" /> View site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
