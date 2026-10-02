'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/endpoints';
import { API_URL } from '@/lib/api/client';
import { rememberNext } from '@/lib/auth/oauth-next';

/**
 * Social sign-in buttons.
 *
 * Rendered from `GET /auth/providers` rather than hard-coded: a server without
 * Google/Facebook credentials reports them as unavailable and no button
 * appears, instead of offering one that dead-ends in an error.
 */
export function SocialAuth({
  mode,
  next,
}: {
  mode: 'login' | 'register';
  next?: string | null;
}) {
  const { data: providers } = useQuery({
    queryKey: ['auth-providers'],
    queryFn: authApi.providers,
    // Whether a provider is configured changes on deploy, not during a session.
    staleTime: 5 * 60 * 1000,
  });

  const available = [
    providers?.google &&
      ({ id: 'google', label: 'Google', Icon: GoogleMark } as const),
    providers?.facebook &&
      ({ id: 'facebook', label: 'Facebook', Icon: FacebookMark } as const),
  ].filter(Boolean) as {
    id: string;
    label: string;
    Icon: () => React.ReactElement;
  }[];

  if (available.length === 0) return null;

  const verb = mode === 'register' ? 'Sign up' : 'Log in';

  return (
    <>
      <div className="mt-8 space-y-3">
        {available.map(({ id, label, Icon }) => (
          /**
           * A plain <a>, not a fetch: OAuth is a full-page browser redirect to
           * the provider. An XHR would be blocked by CORS and could not show
           * the consent screen anyway.
           *
           * Where the user was headed is stashed same-origin before we leave,
           * not round-tripped through the provider — nothing about the
           * destination is theirs to see or to tamper with.
           */
          <a
            key={id}
            href={`${API_URL}/auth/${id}`}
            onClick={() => rememberNext(next)}
            className="border-input bg-surface-raised hover:bg-muted focus-visible:ring-ring flex h-10 w-full items-center justify-center gap-3 rounded-md border text-sm font-medium transition-colors duration-[--dur-fast] ease-[--ease-out-soft] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Icon />
            {verb} with {label}
          </a>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or use your email</span>
        <span className="bg-border h-px flex-1" />
      </div>
    </>
  );
}

/* Brand marks are inline so they inherit nothing from the theme and need no
   network request. Official colours — these must not be re-tinted. */

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 40.2 44 35 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  );
}
