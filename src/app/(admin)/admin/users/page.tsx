'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, Trash2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { adminUsersApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { useDebounced } from '@/lib/hooks/use-debounced';
import { formatDate, initials, plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ROLES = ['ALL', 'STUDENT', 'ADMIN'] as const;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('ALL');
  const q = useDebounced(search, 350);

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-users', { q, role }],
    queryFn: () =>
      adminUsersApi.list({
        q: q || undefined,
        role: role === 'ALL' ? undefined : role,
        limit: 50,
      }),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
    ]);

  const setRoleMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      adminUsersApi.setRole(id, next),
    onSuccess: async (user) => {
      await refresh();
      toast.success(`${user.name} is now ${user.role.toLowerCase()}`);
    },
    // The API protects the last admin and self-demotion; surface its reason.
    onError: (error) => toast.error(errorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.remove(id),
    onSuccess: async () => {
      await refresh();
      toast.success('User deleted');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Everyone with an account.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-8"
            aria-label="Search users"
          />
        </div>
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                role === r
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-destructive rounded-lg border border-dashed p-6 text-sm">
          {errorMessage(error)}
        </p>
      ) : isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">No users match</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {data.items.map((user) => {
            const isMe = user.id === me?.id;
            const busy =
              setRoleMutation.isPending || removeMutation.isPending;

            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center gap-4 p-4"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {user.name}
                    {isMe && (
                      <span className="text-muted-foreground text-xs font-normal">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {user.email} · joined {formatDate(user.createdAt)}
                  </p>
                </div>

                <div className="text-muted-foreground hidden text-xs sm:block">
                  <p>{plural(user._count.enrollments, 'enrolment')}</p>
                  {user._count.coursesCreated > 0 && (
                    <p>{plural(user._count.coursesCreated, 'course')} authored</p>
                  )}
                </div>

                {/* Icon + label, never colour alone. */}
                <Badge
                  variant={user.role === 'ADMIN' ? 'default' : 'outline'}
                  className="gap-1"
                >
                  {user.role === 'ADMIN' ? (
                    <Shield className="size-3" />
                  ) : (
                    <UserIcon className="size-3" />
                  )}
                  {user.role === 'ADMIN' ? 'Admin' : 'Student'}
                </Badge>

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || isMe}
                    onClick={() =>
                      setRoleMutation.mutate({
                        id: user.id,
                        next: user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN',
                      })
                    }
                  >
                    {user.role === 'ADMIN' ? 'Make student' : 'Make admin'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy || isMe}
                    aria-label={`Delete ${user.name}`}
                    onClick={() => {
                      if (
                        confirm(
                          `Delete ${user.name}? Their enrolments and quiz history go with them.`,
                        )
                      ) {
                        removeMutation.mutate(user.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
