'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import type { Category, Difficulty } from '@/lib/types/api';
import { DIFFICULTY_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'title', label: 'A–Z' },
];

/**
 * Filters live in the URL, not in component state: the catalog is a server
 * component, so changing a filter is a navigation. It also makes any filtered
 * view shareable and back-button friendly.
 */
export function CatalogFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get('q') ?? '');

  const push = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      // Any filter change invalidates the current page number.
      next.delete('page');
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce the search box so typing does not fire a navigation per keystroke.
  useEffect(() => {
    const current = params.get('q') ?? '';
    if (search === current) return;

    const timer = setTimeout(() => {
      push((next) => {
        if (search) next.set('q', search);
        else next.delete('q');
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [search, params, push]);

  const difficulty = params.get('difficulty');
  const category = params.get('category');
  const sort = params.get('sort') ?? 'newest';
  const hasFilters = Boolean(
    params.get('q') || difficulty || category || params.get('sort'),
  );

  const toggle = (key: string, value: string) =>
    push((next) => {
      if (next.get(key) === value) next.delete(key);
      else next.set(key, value);
    });

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <div className="space-y-2">
        <Label htmlFor="catalog-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="catalog-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="HTML, APIs…"
            className="pl-8"
          />
        </div>
      </div>

      <FilterGroup label="Level">
        {DIFFICULTIES.map((value) => (
          <FilterChip
            key={value}
            active={difficulty === value}
            onClick={() => toggle('difficulty', value)}
          >
            {DIFFICULTY_LABEL[value]}
          </FilterChip>
        ))}
      </FilterGroup>

      {categories.length > 0 && (
        <FilterGroup label="Topic">
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.slug}
              onClick={() => toggle('category', c.slug)}
            >
              {c.name}
              <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
                {c.publishedCourses ?? 0}
              </span>
            </FilterChip>
          ))}
        </FilterGroup>
      )}

      <FilterGroup label="Sort">
        {SORTS.map((s) => (
          <FilterChip
            key={s.value}
            active={sort === s.value}
            onClick={() =>
              push((next) => {
                if (s.value === 'newest') next.delete('sort');
                else next.set('sort', s.value);
              })
            }
          >
            {s.label}
          </FilterChip>
        ))}
      </FilterGroup>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setSearch('');
            router.push(pathname, { scroll: false });
          }}
        >
          <X className="mr-1 size-3.5" /> Clear filters
        </Button>
      )}
    </aside>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
