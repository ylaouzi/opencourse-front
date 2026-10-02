'use client';

/**
 * Chart primitives for the admin dashboard.
 *
 * Every chart here is SINGLE-SERIES, so the form choices follow the data's job
 * rather than reaching for a categorical palette:
 *   - headline numbers  -> stat tiles, not one-bar charts
 *   - trend over time   -> area + line, one sequential hue
 *   - compare magnitude -> horizontal bars, one sequential hue
 *   - ratio vs a limit  -> meter on a same-ramp track
 *
 * A single series needs no legend — the title names it. Colours are the
 * validated blue (light #2a78d6 / dark #3987e5), both modes passing the
 * lightness, chroma and 3:1 contrast checks.
 */

import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

export function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('bg-card viz-root rounded-lg border p-5', className)}
    >
      <h2 className="font-medium">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Value + label. The right form for a headline number (never a one-bar chart). */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <dt className="text-muted-foreground flex items-center gap-2 text-sm">
        {Icon && <Icon className="size-4" />}
        {label}
      </dt>
      <dd className="mt-1.5 text-3xl font-semibold tabular-nums">{value}</dd>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}

/** A single ratio against a limit: a meter, not a two-slice pie. */
export function Meter({
  label,
  percent,
  caption,
}: {
  label: string;
  percent: number;
  caption?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{clamped}%</span>
      </div>
      <div
        className="bg-muted mt-2 h-2 overflow-hidden rounded-full"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-[var(--series-1)] transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {caption && (
        <p className="text-muted-foreground mt-1.5 text-xs">{caption}</p>
      )}
    </div>
  );
}

/**
 * Trend over time, one series. Area + 2px line, recessive grid, hover crosshair
 * with a tooltip — an SVG chart on a page is interactive by default.
 */
export function TrendArea({
  points,
  height = 140,
  formatLabel,
}: {
  points: { label: string; value: number }[];
  height?: number;
  formatLabel?: (label: string) => string;
}) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No data for this period yet.
      </p>
    );
  }

  /**
   * One point is not a trend. A polyline of a single point renders nothing,
   * and an area anchored to the left edge would draw a rise from zero that
   * never happened — so a lone reading is stated as a figure instead of being
   * dressed up as a line.
   */
  if (points.length === 1) {
    return (
      <div className="py-8 text-center">
        <p className="text-4xl font-semibold tabular-nums">
          {points[0].value}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          on {formatLabel ? formatLabel(points[0].label) : points[0].label} — the
          only day with activity in this period
        </p>
      </div>
    );
  }

  const width = 600;
  const pad = { top: 8, right: 8, bottom: 20, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...points.map((p) => p.value), 1);

  const x = (i: number) => pad.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  // Anchored to the first and last data points, never to the padding — closing
  // on the box edge invents a slope on either side of the real series.
  const area = `${x(0)},${pad.top + innerH} ${line} ${x(points.length - 1)},${pad.top + innerH}`;

  const active = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Trend of ${points.length} points, peak ${max}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive baseline — the only grid line this chart needs. */}
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={width - pad.right}
          y2={pad.top + innerH}
          className="stroke-border"
          strokeWidth="1"
        />

        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {active && hover !== null && (
          <>
            <line
              x1={x(hover)}
              y1={pad.top}
              x2={x(hover)}
              y2={pad.top + innerH}
              className="stroke-border"
              strokeWidth="1"
            />
            {/* 2px surface ring keeps the marker readable over the area fill. */}
            <circle
              cx={x(hover)}
              cy={y(active.value)}
              r="5"
              fill="var(--series-1)"
              className="stroke-card"
              strokeWidth="2"
            />
          </>
        )}

        {/* Hit targets are far wider than the marks. */}
        {points.map((p, i) => (
          <rect
            key={p.label}
            x={x(i) - innerW / points.length / 2}
            y={0}
            width={innerW / points.length}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {active && (
        <div className="bg-popover pointer-events-none absolute top-0 right-0 rounded-md border px-2.5 py-1.5 text-xs shadow-sm">
          <p className="font-medium tabular-nums">
            {active.value} {active.value === 1 ? 'signup' : 'signups'}
          </p>
          <p className="text-muted-foreground">
            {formatLabel ? formatLabel(active.label) : active.label}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compare magnitude across a handful of items. Horizontal because course titles
 * are long, direct-labelled because there are few rows.
 */
export function BarList({
  items,
}: {
  items: { id: string; label: string; value: number; caption?: string }[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Nothing to rank yet.
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm">{item.label}</span>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {item.value}
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-[var(--series-1)]"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          {item.caption && (
            <p className="text-muted-foreground mt-1 text-xs">{item.caption}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
