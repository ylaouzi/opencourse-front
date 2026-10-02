'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { adminCoursesApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { ButtonLink } from '@/components/ui/button-link';
import { CourseForm, type CourseFormValues } from '@/components/admin/course-form';

export default function NewCoursePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (values: CourseFormValues) => adminCoursesApi.create(values),
    onSuccess: async (course) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course created as a draft');
      // Straight into the builder — an empty course is not publishable yet.
      router.push(`/admin/courses/${course.id}`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="max-w-2xl">
      <ButtonLink variant="ghost" size="sm" href="/admin/courses">
        <ArrowLeft className="mr-1 size-4" /> Back to courses
      </ButtonLink>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">New course</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        It starts as a draft. Add modules, lessons and quizzes before
        publishing.
      </p>

      <CourseForm
        submitLabel="Create course"
        pending={create.isPending}
        onSubmit={(values) => create.mutate(values)}
      />
    </div>
  );
}
