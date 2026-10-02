'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  applyTheme,
  getServerTheme,
  getTheme,
  setTheme,
  subscribeToTheme,
  type Theme,
} from '@/lib/theme';
import { Button } from '@/components/ui/button';

const OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle() {
  // Undefined during SSR: the server has no way to know the stored theme.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getTheme,
    getServerTheme,
  );

  // "System" must keep following the OS after the first paint. This is a real
  // subscription to an external system, which is what effects are for.
  useEffect(() => {
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  if (!theme) {
    return <div className="bg-muted size-7 animate-pulse rounded-md" />;
  }

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
  const Icon = current.icon;

  const cycle = () => {
    const index = OPTIONS.findIndex((o) => o.value === current.value);
    setTheme(OPTIONS[(index + 1) % OPTIONS.length].value);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      // The icon alone leaves the current state invisible to a screen reader.
      aria-label={`Theme: ${current.label}. Activate to change.`}
      title={`Theme: ${current.label}`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
