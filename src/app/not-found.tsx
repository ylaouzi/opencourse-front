import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Compass className="text-muted-foreground size-10" />
      <h1 className="mt-6 text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The page you are looking for does not exist, or it is not published.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/courses">Browse courses</ButtonLink>
        <ButtonLink variant="outline" href="/">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
