import { AuthGuard } from '@/components/auth/auth-guard';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

/**
 * The admin console runs in its own shell — not the learner site's header with
 * admin pages hung off it. Nothing from the student navigation appears here;
 * the way back is the explicit "View site" link in the sidebar and the account
 * menu.
 *
 * `requiredRole` is UX only — it stops a student wandering into a screen that
 * would just 403. The real boundary is RolesGuard on the API.
 *
 * The guard wraps the whole shell rather than only the content, so a
 * non-admin never sees the admin chrome render around a redirect.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="bg-surface-base flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          {/* Wider than the learner site's max-w-6xl: admin screens are tables
              and builders, not reading columns. */}
          <main
            id="main"
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6"
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
