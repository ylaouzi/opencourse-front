'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, User } from '@/lib/types/api';

interface AuthState {
  token: string | null;
  user: User | null;
  /**
   * False until zustand has read localStorage. Guards must wait for this —
   * rendering before rehydration flash-redirects to /login on every refresh
   * (plan §6.4).
   */
  hydrated: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      signIn: ({ accessToken, user }) => set({ token: accessToken, user }),
      signOut: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'auth',
      // `hydrated` is runtime state, never persisted.
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/**
 * Read the token outside React (axios interceptors). Going through the store
 * rather than localStorage directly keeps one source of truth.
 */
export const getToken = () => useAuthStore.getState().token;

/**
 * JWT payloads are base64**url** encoded: they use `-`/`_` instead of `+`/`/`
 * and drop the `=` padding. Passing that straight to `atob` throws, so the
 * alphabet has to be translated and the padding restored first.
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  try {
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

/** JWTs here last a day and there is no refresh endpoint (plan §6.4). */
export function isTokenExpired(token: string): boolean {
  const claims = decodeJwtPayload(token);

  // An unreadable token is NOT treated as expired: the API is the authority on
  // validity, and guessing "expired" here would sign people out on a decoding
  // quirk. A genuinely bad token still gets a 401, which the interceptor
  // handles.
  if (!claims || typeof claims.exp !== 'number') return false;

  return claims.exp * 1000 < Date.now();
}
