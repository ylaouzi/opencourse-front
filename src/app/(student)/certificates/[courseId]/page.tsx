'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Award, Loader2, Printer } from 'lucide-react';
import { profileApi } from '@/lib/api/endpoints';
import { errorMessage, errorStatus } from '@/lib/api/client';
import { DIFFICULTY_LABEL, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();

  const { data, isPending, error } = useQuery({
    queryKey: ['certificate', courseId],
    queryFn: () => profileApi.certificate(courseId),
  });

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    // 404 here means "not finished yet" and the message carries the percentage.
    const unfinished = errorStatus(error) === 404;

    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">
          {unfinished ? 'Not finished yet' : 'Certificate unavailable'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {errorMessage(error)}
        </p>
        <ButtonLink className="mt-6" href={`/learn/${courseId}`}>
          Keep learning
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 size-4" /> Print or save as PDF
        </Button>
      </div>

      {/* print:* utilities strip the app chrome so the sheet prints alone. */}
      <article className="bg-card rounded-lg border-2 p-10 text-center print:border-0 print:shadow-none sm:p-16">
        <Award className="text-primary mx-auto size-12" />

        <p className="text-muted-foreground mt-6 text-xs tracking-[0.2em] uppercase">
          Certificate of completion
        </p>

        <p className="text-muted-foreground mt-8 text-sm">
          This certifies that
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-balance">
          {data.learnerName}
        </p>

        <p className="text-muted-foreground mt-6 text-sm">
          has successfully completed
        </p>
        <p className="mt-2 text-xl font-semibold text-balance">
          {data.courseTitle}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {DIFFICULTY_LABEL[data.difficulty]} level
          {data.finalScore !== null &&
            ` · final exam scored ${data.finalScore}%`}
        </p>

        <dl className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-4 border-t pt-8 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Completed</dt>
            <dd className="mt-0.5 font-medium">
              {formatDate(data.completedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Instructor</dt>
            <dd className="mt-0.5 font-medium">{data.instructorName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Verification</dt>
            <dd className="mt-0.5 font-mono font-medium">
              {data.verificationCode}
            </dd>
          </div>
        </dl>
      </article>

      <p className="text-muted-foreground mt-6 text-center text-sm print:hidden">
        Issued by OpenCourse ·{' '}
        <ButtonLink variant="link" href={`/courses/${data.courseSlug}`}>
          View the course
        </ButtonLink>
      </p>
    </div>
  );
}
