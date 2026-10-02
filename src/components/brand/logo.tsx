// useId keeps each instance's gradient id unique, and hooks are client-only —
// the footer that renders this is a Server Component.
'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The OpenCourse mark.
 *
 * Three ascending steps inside an open ring, with the last step breaking out
 * through the ring's gap. The ring is a course in progress; the steps are the
 * modules behind it; the breakthrough is the point — progress that runs past
 * the circle rather than politely filling it.
 *
 * The gap is not decoration: it is where the tallest step exits, so the two
 * shapes are one idea rather than an icon with bars parked inside it.
 *
 * Colour comes from the theme tokens rather than fixed hexes, so the mark is
 * literally the app's brand in both modes instead of a copy that drifts when
 * the palette moves. `mono` swaps to currentColor for stamps, print, and
 * anywhere a gradient cannot go.
 */
export function LogoMark({
  className,
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  // React's useId contains colons, which break `url(#…)` references.
  const gradientId = `logo-${useId().replace(/:/g, '')}`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="OpenCourse"
      className={cn('size-6', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!mono && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="6"
            y1="6"
            x2="42"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--brand-2)" />
          </linearGradient>
        </defs>
      )}

      {/* Open ring. The dash leaves ~33% out, rotated so the opening sits
          exactly where the tall step crosses it. */}
      <circle
        cx="24"
        cy="24"
        r="17"
        stroke={mono ? 'currentColor' : `url(#${gradientId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeDasharray="72 107"
        transform="rotate(28 24 24)"
      />

      <g fill={mono ? 'currentColor' : 'var(--primary)'}>
        <rect x="13" y="26" width="5.5" height="8" rx="2.75" />
        <rect x="21.25" y="21" width="5.5" height="13" rx="2.75" />
        <rect x="29.5" y="6" width="5.5" height="28" rx="2.75" />
      </g>
    </svg>
  );
}

/** Mark plus wordmark — the standard lockup for headers and the footer. */
export function Logo({
  className,
  markClassName,
  mono = false,
}: {
  className?: string;
  markClassName?: string;
  mono?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-2 font-semibold', className)}>
      <LogoMark className={markClassName} mono={mono} />
      {/* The mark already carries the aria-label; repeating it would make
          screen readers say "OpenCourse OpenCourse". */}
      <span aria-hidden>OpenCourse</span>
    </span>
  );
}
