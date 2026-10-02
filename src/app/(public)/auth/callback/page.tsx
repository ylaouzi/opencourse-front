import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OAuthCallback } from '@/components/auth/oauth-callback';

export const metadata: Metadata = { title: 'Signing you in' };

export default function OAuthCallbackPage() {
  // useSearchParams needs a Suspense boundary to keep the route prerenderable.
  return (
    <Suspense fallback={null}>
      <OAuthCallback />
    </Suspense>
  );
}
