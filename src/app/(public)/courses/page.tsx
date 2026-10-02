import type { Metadata } from 'next';
import { serverFetch } from '@/lib/api/server';
import type { Category, CourseCard, Paginated } from '@/lib/types/api';
import { CatalogFilters } from '@/components/course/catalog-filters';
import { CourseGrid } from '@/components/course/course-grid';
import { CatalogPagination } from '@/components/course/catalog-pagination';

export const metadata: Metadata = {
  title: 'Courses',
  description:
    'Browse every published course: filter by topic, level and popularity.',
};

const PAGE_SIZE = 9;

/**
 * Server component so the catalog is crawlable. `searchParams` is a Promise in
 * Next 16 — synchronous access was removed.
 */
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const query = {
    q: first('q'),
    difficulty: first('difficulty'),
    category: first('category'),
    sort: first('sort') ?? 'newest',
    page: Number(first('page') ?? 1) || 1,
    limit: PAGE_SIZE,
  };

  const [data, categories] = await Promise.all([
    serverFetch<Paginated<CourseCard>>('/courses', query),
    serverFetch<Category[]>('/categories'),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground mt-2">
          {data.total === 0
            ? 'No courses match your filters yet.'
            : `${data.total} course${data.total === 1 ? '' : 's'} to explore.`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <CatalogFilters categories={categories} />

        <div>
          <CourseGrid courses={data.items} />
          <CatalogPagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
          />
        </div>
      </div>
    </div>
  );
}
