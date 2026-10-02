'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { catalogApi } from '@/lib/api/endpoints';
import type { AdminCourseTree, Difficulty } from '@/lib/types/api';
import { DIFFICULTY_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CoverPicker } from './cover-picker';

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

// Mirrors CreateCourseDto so the client rejects what the API would reject.
const schema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(200),
  description: z.string().min(10, 'At least 10 characters').max(5000),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  categoryId: z.string().optional(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Lowercase words separated by single hyphens',
    )
    .optional()
    .or(z.literal('')),
  // No .url() rule any more: this value is produced by our own uploader, not
  // typed by hand, so the only states are "a path we returned" or "".
  coverUrl: z.string().optional(),
});

export type CourseFormValues = z.infer<typeof schema>;

export function CourseForm({
  course,
  submitLabel,
  pending,
  onSubmit,
}: {
  course?: AdminCourseTree;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: CourseFormValues) => void;
}) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.categories,
  });

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: course?.title ?? '',
      description: course?.description ?? '',
      difficulty: course?.difficulty ?? 'BEGINNER',
      categoryId: course?.category?.id ?? '',
      slug: course?.slug ?? '',
      coverUrl: course?.coverUrl ?? '',
    },
  });

  // useWatch rather than form.watch(): the latter returns a fresh function
  // each render, which makes React Compiler skip memoizing this component.
  const difficulty = useWatch({ control: form.control, name: 'difficulty' });
  const categoryId = useWatch({ control: form.control, name: 'categoryId' });
  const coverUrl = useWatch({ control: form.control, name: 'coverUrl' });

  const submit = (values: CourseFormValues) =>
    onSubmit({
      ...values,
      // Empty strings would fail @IsUrl/@IsUUID on the API; omit instead.
      slug: values.slug || undefined,
      coverUrl: values.coverUrl || undefined,
      categoryId: values.categoryId || undefined,
    });

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register('title')} />
        <FieldError message={form.formState.errors.title?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...form.register('description')} />
        <FieldError message={form.formState.errors.description?.message} />
      </div>

      <div className="space-y-2">
        <Label>Level</Label>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={difficulty === value}
              onClick={() =>
                form.setValue('difficulty', value, { shouldDirty: true })
              }
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                difficulty === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              {DIFFICULTY_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!categoryId}
            onClick={() =>
              form.setValue('categoryId', '', { shouldDirty: true })
            }
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              !categoryId
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-muted text-muted-foreground',
            )}
          >
            None
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoryId === c.id}
              onClick={() =>
                form.setValue('categoryId', c.id, { shouldDirty: true })
              }
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                categoryId === c.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <CoverPicker
        value={coverUrl ?? ''}
        onChange={(url) =>
          form.setValue('coverUrl', url, { shouldDirty: true })
        }
        seed={course?.id ?? 'new-course'}
        title={course?.title}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">
            URL slug{' '}
            <span className="text-muted-foreground font-normal">
              {course ? '' : '(auto)'}
            </span>
          </Label>
          <Input
            id="slug"
            placeholder="introduction-to-web-development"
            {...form.register('slug')}
          />
          <FieldError message={form.formState.errors.slug?.message} />
          {course && (
            <p className="text-muted-foreground text-xs">
              Changing this breaks existing links to the course.
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}
