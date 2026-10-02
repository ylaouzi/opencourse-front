'use client';

export type Theme = 'light' | 'dark' | 'system';

const KEY = 'theme';
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

/**
 * The theme is an external mutable value: it lives in localStorage and in a
 * class on <html>, both of which React does not own. Modelling it as a real
 * external store (rather than reading it into state inside an effect) is what
 * `useSyncExternalStore` is for — and it keeps the server snapshot explicit.
 */
export function subscribeToTheme(onChange: () => void) {
  listeners.add(onChange);

  // Another tab changing the theme should be reflected here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme | null) ?? 'system';
}

/**
 * The server cannot know the stored theme, so it has no answer. Rendering a
 * placeholder until the client snapshot arrives is what avoids a hydration
 * mismatch — the no-flash script has already painted the right colours.
 */
export function getServerTheme(): Theme | undefined {
  return undefined;
}

export function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function setTheme(theme: Theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
  notify();
}
