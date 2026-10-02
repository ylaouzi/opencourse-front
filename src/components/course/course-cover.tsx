'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A course cover that is never an empty grey box.
 *
 * When there is no usable image the cover is GENERATED — but not randomly. The
 * course id is hashed onto the brand's own hue arc (indigo 258° → magenta 338°),
 * so every generated cover is a different stop on one deliberate sweep. They
 * vary, they never clash, and the same course always gets the same cover.
 */
const ARC_START = 258;
const ARC_END = 338;

/**
 * FNV-1a, normalised to [0, 1).
 *
 * The obvious `(hash << 5) - hash` with `% 1000` clusters badly on structurally
 * similar strings — two UUIDs landed 2° apart on an 80° arc, so every cover came
 * out the same colour. FNV-1a avalanches properly, so similar ids land far
 * apart and the whole arc gets used.
 *
 * (Golden-ratio spreading is the usual companion trick, but it only applies to
 * integer *sequences*; on an already-uniform hash it just squashes the range
 * into [0, 0.618).)
 */
function hashToUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export function CourseCover({
  src,
  seed,
  title,
  className,
  showGlyph = true,
  onSrcError,
}: {
  src?: string | null;
  /** Stable per course — the id, so the cover never changes between renders. */
  seed: string;
  title?: string;
  className?: string;
  showGlyph?: boolean;
  /** Fires when `src` fails to load, so an editor can flag a dead cover. */
  onSrcError?: () => void;
}) {
  /**
   * A stored cover can point at something that is not an image — a link to an
   * article, a dead URL, a host that blocks hotlinking. Rather than rendering a
   * silent void, fall back to the generated cover the moment loading fails.
   */
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      <div className={cn('bg-muted relative overflow-hidden', className)}>
        {/* Covers come from the API's own /uploads path; a plain img avoids
            configuring next/image remote patterns for a self-hosted file. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          onError={() => {
            setBroken(true);
            onSrcError?.();
          }}
          className="size-full object-cover transition-transform duration-[--dur-slow] ease-[--ease-out-soft] group-hover:scale-105 motion-reduce:transform-none"
        />
      </div>
    );
  }

  const t = hashToUnit(seed);
  const from = ARC_START + t * (ARC_END - ARC_START);
  const to = from + 26; // short sweep keeps each cover reading as one colour

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        // Restrained chroma on purpose: the cover should set a mood and let the
        // title carry the card, not shout over it.
        backgroundImage: `linear-gradient(135deg,
          oklch(0.74 0.095 ${from}) 0%,
          oklch(0.60 0.125 ${to}) 100%)`,
      }}
      aria-hidden
    >
      {/* Soft radial bloom stops the flat gradient reading as a placeholder. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(120% 90% at 15% 5%,
            oklch(1 0 0 / 0.28) 0%, transparent 55%)`,
        }}
      />
      {showGlyph && (
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen
            className="size-10 text-white/70 transition-transform duration-[--dur-slow] ease-[--ease-out-soft] group-hover:scale-110 motion-reduce:transform-none"
            strokeWidth={1.5}
          />
        </div>
      )}
      {title && <span className="sr-only">{title}</span>}
    </div>
  );
}
