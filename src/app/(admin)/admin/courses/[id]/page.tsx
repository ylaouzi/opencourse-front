'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminCoursesApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { ButtonLink } from '@/components/ui/button-link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/admin/status-badge';
import { CourseForm, type CourseFormValues } from '@/components/admin/course-form';
import { CurriculumBuilder } from '@/components/admin/curriculum-builder';
import { PublishPanel } from '@/components/admin/publish-panel';
import { CourseStudents } from '@/components/admin/course-students';

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: course,
    isPending,
    error,
  } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: () => adminCoursesApi.get(id),
  });

  const update = useMutation({
    mutationFn: (values: CourseFormValues) =>
      adminCoursesApi.update(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-course', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course updated');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => adminCoursesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course deleted');
      router.push('/admin/courses');
    },
    // The API refuses to delete a course with enrollments and says so.
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-destructive rounded-lg border border-dashed p-6 text-sm">
        {errorMessage(error)}
      </p>
    );
  }

  return (
    <div>
      <ButtonLink variant="ghost" size="sm" href="/admin/courses">
        <ArrowLeft className="mr-1 size-4" /> Back to courses
      </ButtonLink>

      <header className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={course.status} />
            <span className="text-muted-foreground text-xs">
              /{course.slug}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            {course.title}
          </h1>
        </div>

        {course.status === 'PUBLISHED' && (
          <ButtonLink
            variant="outline"
            size="sm"
            href={`/courses/${course.slug}`}
          >
            View live <ExternalLink className="ml-1.5 size-3.5" />
          </ButtonLink>
        )}
      </header>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="students">
            Students ({course._count.enrollments})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
            <CurriculumBuilder course={course} />
            <PublishPanel course={course} />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6 max-w-2xl">
          <CourseForm
            course={course}
            submitLabel="Save changes"
            pending={update.isPending}
            onSubmit={(values) => update.mutate(values)}
          />

          <div className="border-destructive/30 mt-10 rounded-lg border p-5">
            <h2 className="font-medium">Delete this course</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Permanently removes the course and its curriculum. Courses with
              enrolled learners cannot be deleted — archive them instead.
            </p>
            <Button
              variant="destructive"
              className="mt-4"
              disabled={remove.isPending}
              onClick={() => {
                if (
                  confirm(
                    `Delete "${course.title}"? This cannot be undone.`,
                  )
                ) {
                  remove.mutate();
                }
              }}
            >
              <Trash2 className="mr-2 size-4" /> Delete course
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <CourseStudents courseId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
