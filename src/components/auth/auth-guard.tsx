'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { isTokenExpired, useAuthStore } from '@/lib/stores/auth';
import type { Role } from '@/lib/types/api';

/**
 * Client-side route gate.
 *
 * With the JWT in localStorage the server cannot see it, so `middleware.ts`
 * could only ever do a cosmetic redirect (plan §6.4). This is UX only — the
 * real boundary is JwtAuthGuard + RolesGuard on the API, which is why every
 * protected screen still handles a 401/403 from the network.
 */
export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, hydrated, signOut } = useAuthStore();

  const expired = token ? isTokenExpired(token) : false;
  const authorised =
    Boolean(token) && !expired && (!requiredRole || user?.role === requiredRole);

  useEffect(() => {
    // Wait for localStorage to be read, or every refresh flashes a redirect.
    if (!hydrated) return;

    if (!token || expired) {
      if (expired) signOut();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/dashboard');
    }
  }, [hydrated, token, expired, user, requiredRole, router, pathname, signOut]);

  if (!hydrated || !authorised) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
        <span className="sr-only">Checking your session</span>
      </div>
    );
  }

  return <>{children}</>;
}
