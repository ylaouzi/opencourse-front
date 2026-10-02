'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Menu,
  LayoutDashboard,
  LogOut,
  Shield,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gamificationApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/stores/auth';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
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
import { Logo } from '@/components/brand/logo';

const NAV = [
  { href: '/courses', label: 'Courses' },
  // Learner surfaces. An admin cannot hold an enrolment, so for them these
  // two are permanently empty — they are filtered out below rather than left
  // as dead links.
  { href: '/dashboard', label: 'Dashboard', authOnly: true, learnerOnly: true },
  {
    href: '/my-courses',
    label: 'My courses',
    authOnly: true,
    learnerOnly: true,
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { token, user, hydrated, signOut } = useAuthStore();
  const signedIn = hydrated && Boolean(token);
  const isAdmin = user?.role === 'ADMIN';

  const { data: gamification } = useQuery({
    queryKey: ['gamification-me'],
    queryFn: gamificationApi.me,
    enabled: signedIn && !isAdmin,
  });

  /**
   * The learner site still has to be browsable by an admin — checking how a
   * course actually looks is part of the job — but it should not offer them
   * learner-only destinations they can never populate.
   */
  const visibleNav = NAV.filter(
    (item) => (!item.authOnly || signedIn) && !(item.learnerOnly && isAdmin),
  );

  const handleSignOut = () => {
    signOut();
    // Full navigation rather than router.push: it beats AuthGuard's redirect
    // on the page being left, and it drops the TanStack Query cache so the
    // next user never sees the previous one's data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload, see above
    window.location.assign('/');
  };

  return (
    <header className="bg-surface-bar/85 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/">
          <Logo />
        </Link>

        {/* The desktop nav is hidden below md, so the same links need a
            reachable home on small screens. */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
              'md:hidden',
            )}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-4 pb-4">
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm"
                >
                  Admin
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <nav className="hidden items-center gap-1 md:flex">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {signedIn && !isAdmin && gamification && (
            <Link
              href="/dashboard"
              className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 mr-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
              title={`${gamification.totalXp} XP (${gamification.level.xpToNextLevel} XP to Level ${gamification.level.level + 1})`}
            >
              <Zap className="size-3.5 fill-current" />
              <span>Lvl {gamification.level.level}</span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-muted-foreground hidden tabular-nums sm:inline">
                {gamification.totalXp} XP
              </span>
            </Link>
          )}

          <ThemeToggle />

          {/* Render a placeholder until rehydration, otherwise the header
              flickers from signed-out to signed-in on every page load. */}
          {!hydrated ? (
            <div className="bg-muted size-9 animate-pulse rounded-full" />
          ) : signedIn && user ? (
            <DropdownMenu>
              {/* Styled with buttonVariants rather than composing <Button>:
                  Menu.Trigger is already a Base UI button, and nesting two of
                  them leaves the trigger inert. */}
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
                {/* Base UI requires GroupLabel to live inside a Group —
                    without this the whole menu throws on open. */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {!isAdmin && (
                  <DropdownMenuItem render={<Link href="/dashboard" />}>
                    <LayoutDashboard className="mr-2 size-4" /> Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <UserIcon className="mr-2 size-4" /> Profile
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    <Shield className="mr-2 size-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <ButtonLink variant="ghost" href="/login">
                Log in
              </ButtonLink>
              <ButtonLink href="/register">Sign up</ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
