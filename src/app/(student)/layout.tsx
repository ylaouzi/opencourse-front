import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AuthGuard } from '@/components/auth/auth-guard';

/**
 * Everything under this group is client-rendered behind AuthGuard: with the
 * token in localStorage the server cannot know who the visitor is (plan §6.4).
 */
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <AuthGuard>{children}</AuthGuard>
      </main>
      <SiteFooter />
    </div>
  );
}
