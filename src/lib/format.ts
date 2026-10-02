import type { Difficulty } from '@/lib/types/api';

/** 95 -> "1h 35min", 40 -> "40min", 0 -> "—" */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

/**
 * Difficulty is an ORDERED scale, so it gets an ordinal ramp of the brand hue —
 * more advanced reads as heavier.
 *
 * It deliberately does NOT use green/amber/red. Those three are load-bearing
 * elsewhere: the quiz correction screen shows correct / missed / wrong at the
 * same time. Sharing hues would make green mean both "beginner" and "correct",
 * and red mean both "advanced" and "wrong".
 */
export const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  BEGINNER: 'bg-primary/10 text-primary',
  INTERMEDIATE: 'bg-primary/20 text-primary',
  ADVANCED: 'bg-primary text-primary-foreground',
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** 1 -> "1 module", 3 -> "3 modules" */
export function plural(count: number, singular: string, pluralForm?: string) {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
