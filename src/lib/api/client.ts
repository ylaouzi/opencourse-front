import axios, { AxiosError } from 'axios';
import { getToken, useAuthStore } from '@/lib/stores/auth';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  // No cookies: the token travels in the Authorization header (plan §6.4).
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Endpoints where a 401 is an ANSWER, not a statement about the session:
 * wrong credentials on login, or the wrong current password when changing it.
 * Signing someone out because they mistyped their existing password would be
 * both baffling and destructive.
 */
const AUTH_401_IS_EXPECTED = [
  '/auth/login',
  '/auth/register',
  '/auth/me/password',
  /**
   * A spent or expired OAuth code 401s. That says nothing about the session —
   * and treating it as expiry is actively harmful: it signs out whoever was
   * already logged in and replaces the callback screen's own explanation with
   * a bounce to /login carrying a useless `next` back to the dead code.
   */
  '/auth/oauth/exchange',
];

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const credentialCheck = AUTH_401_IS_EXPECTED.some((path) =>
      url.startsWith(path),
    );

    // Expired or revoked token. Clear the session and bounce to login with a
    // return path, but never redirect away from the login page itself.
    if (status === 401 && !credentialCheck && typeof window !== 'undefined') {
      const { token, signOut } = useAuthStore.getState();
      if (token) signOut();

      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        // This interceptor runs outside React, where no router is available.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- no router outside React
        window.location.href = `/login?next=${encodeURIComponent(
          path + window.location.search,
        )}`;
      }
    }

    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * The API returns `message` as a string OR a string array (ValidationPipe, the
 * publish guard, quiz submission problems). Every caller goes through this so
 * both shapes render the same way.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    const message = body?.message;

    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string') return message;
    if (!error.response) return 'Cannot reach the server. Is the API running?';
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** All problems, for forms that list them (e.g. the publish checklist). */
export function errorMessages(error: unknown): string[] {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as ApiErrorBody | undefined)?.message;
    if (Array.isArray(message)) return message;
    if (typeof message === 'string') return [message];
  }
  return [errorMessage(error)];
}

export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
