const KEY = 'oauth:next';

/**
 * Carry the post-login destination across the OAuth round trip.
 *
 * sessionStorage rather than a query parameter on the provider URL: the
 * destination is nobody's business but ours, it survives the redirect because
 * the tab and origin are unchanged, and it cannot come back altered.
 */
export function rememberNext(next?: string | null) {
  if (typeof window === 'undefined') return;

  if (next && isSafeInternalPath(next)) {
    sessionStorage.setItem(KEY, next);
  } else {
    sessionStorage.removeItem(KEY);
  }
}

/** Reads and clears — a stale destination must not hijack a later sign-in. */
export function takeNext(fallback = '/dashboard'): string {
  if (typeof window === 'undefined') return fallback;

  const stored = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);

  return stored && isSafeInternalPath(stored) ? stored : fallback;
}

/**
 * Re-checked on the way out as well as on the way in.
 *
 * A leading slash that is NOT followed by another slash or a backslash.
 * `//evil.com` and `/\evil.com` are protocol-relative URLs that browsers
 * resolve as absolute, so a bare `startsWith('/')` would wave them through and
 * turn this into an open redirect.
 */
export function isSafeInternalPath(path: string): boolean {
  return /^\/(?![/\\])/.test(path);
}
