'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';

/**
 * Catches render-time errors anywhere below the root layout. Without it, a
 * thrown component leaves the visitor on a blank page.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Somewhere to hook a real reporter in later.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="size-10 text-warning" />
      <h1 className="mt-6 text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This page hit an unexpected error. Trying again often clears it.
      </p>
      {error.digest && (
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink variant="outline" href="/">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
