'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi, categoriesApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { plural } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data, isPending } = useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.categories,
  });

  const create = useMutation({
    mutationFn: () => categoriesApi.create({ name: name.trim() }),
    onSuccess: async () => {
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
    },
    // A duplicate name comes back as a 409 from the Prisma exception filter.
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Topics learners can filter the catalog by.
        </p>
      </header>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name…"
          aria-label="Category name"
        />
        <Button type="submit" disabled={!name.trim() || create.isPending}>
          {create.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          Add
        </Button>
      </form>

      {isPending ? (
        <div className="bg-muted h-32 animate-pulse rounded-lg" />
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Tags className="text-muted-foreground/50 mx-auto size-10" />
          <p className="mt-4 font-medium">No categories yet</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {data.map((category) => (
            <div key={category.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-muted-foreground text-xs">
                  /{category.slug}
                </p>
              </div>
              <span className="text-muted-foreground text-sm">
                {plural(category.publishedCourses ?? 0, 'published course')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
