'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { takeNext } from '@/lib/auth/oauth-next';
import { ButtonLink } from '@/components/ui/button-link';

/**
 * Where the provider's redirect lands.
 *
 * The URL carries a single-use code, never a token — see AuthCodeStore on the
 * API for why. This trades it for a real session and then leaves, so the spent
 * code does not linger in the address bar.
 */
export function OAuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const signIn = useAuthStore((state) => state.signIn);

  const code = params.get('code');
  const providerError = params.get('error');

  /**
   * useQuery, not useMutation — deliberately, and it took a bug to see why.
   *
   * A mutation's state belongs to the component instance. This screen remounts,
   * and on each remount the mutation reset to `idle` and fired again: the
   * request failed, `onError` ran, then the fresh instance started over. The UI
   * sat on "Signing you in…" forever while the code was redeemed repeatedly.
   *
   * A query's state belongs to its KEY. Keyed on the code, the exchange runs
   * once, the outcome is cached against that code, and remounting reads the
   * cache instead of re-firing. Which is also the honest model: a given code
   * has exactly one outcome.
   */
  const { data, error, isError, isSuccess } = useQuery({
    queryKey: ['oauth-exchange', code],
    queryFn: () => authApi.exchangeOAuthCode(code as string),
    enabled: Boolean(code),
    // A spent code will not un-spend itself, and each attempt burns another.
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  /**
   * Signing in is a side effect, so it lives in an effect rather than a query
   * callback. Keyed on `data`, it runs once per exchanged session even if the
   * render above repeats.
   */
  useEffect(() => {
    if (!isSuccess || !data) return;

    signIn(data);
    toast.success(`Welcome, ${data.user.name}`);
    // replace, not push: Back must not return to a spent code.
    router.replace(data.user.role === 'ADMIN' ? '/admin' : takeNext());
  }, [isSuccess, data, signIn, router]);

  const failure =
    providerError ?? (!code ? 'No sign-in code was returned.' : null);
  const shown = failure ?? (isError ? errorMessage(error) : null);

  if (shown) {
    return (
      <div className="mx-auto w-full max-w-sm py-16 text-center">
        <TriangleAlert className="text-warning mx-auto size-8" />
        <h1 className="mt-4 text-lg font-semibold tracking-tight">
          We could not sign you in
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{shown}</p>
        <ButtonLink href="/login" className="mt-6">
          Back to log in
        </ButtonLink>
        <p className="text-muted-foreground mt-4 text-xs">
          Prefer a password?{' '}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm py-24 text-center">
      <Loader2 className="text-muted-foreground mx-auto size-6 animate-spin" />
      <p className="text-muted-foreground mt-4 text-sm">Signing you in…</p>
    </div>
  );
}
