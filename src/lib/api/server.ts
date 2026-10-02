import { API_URL } from './client';

/**
 * Plain `fetch` for server components.
 *
 * Deliberately not the axios instance: that reads the token from the zustand
 * store, which is a module-level singleton and would be shared across requests
 * on the server. Only public endpoints are fetched here, so no auth is needed
 * — anything user-specific is loaded client-side (plan §6.4).
 */
export async function serverFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  init: RequestInit & { next?: { revalidate?: number } } = {},
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    next: { revalidate: 60 },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${response.status} on ${path}`);
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
