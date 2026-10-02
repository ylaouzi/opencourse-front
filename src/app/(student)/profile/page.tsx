'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { formatDate, initials } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(100),
  bio: z.string().max(500, 'At most 500 characters').optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(6, 'At least 6 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', bio: user?.bio ?? '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const saveProfile = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) =>
      profileApi.update(values),
    onSuccess: (updated) => {
      // Keep the persisted session in step, or the header keeps the old name.
      setUser(updated);
      toast.success('Profile updated');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const changePassword = useMutation({
    mutationFn: (values: z.infer<typeof passwordSchema>) =>
      profileApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Password changed');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">
            {initials(user?.name ?? '')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user?.name}</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant={user?.role === 'ADMIN' ? 'default' : 'outline'}>
              {user?.role === 'ADMIN' ? 'Admin' : 'Student'}
            </Badge>
            {user?.createdAt && (
              <span className="text-muted-foreground text-xs">
                Member since {formatDate(user.createdAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="bg-card rounded-lg border p-6">
        <h2 className="font-medium">Your details</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={profileForm.handleSubmit((v) => saveProfile.mutate(v))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...profileForm.register('name')} />
            {profileForm.formState.errors.name && (
              <p className="text-destructive text-xs">
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} {...profileForm.register('bio')} />
            {profileForm.formState.errors.bio && (
              <p className="text-destructive text-xs">
                {profileForm.formState.errors.bio.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Save changes
          </Button>
        </form>
      </section>

      <section className="bg-card mt-6 rounded-lg border p-6">
        <h2 className="font-medium">Change password</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          You stay signed in on this device after changing it.
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={passwordForm.handleSubmit((v) => changePassword.mutate(v))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...passwordForm.register('currentPassword')}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-destructive text-xs">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register('newPassword')}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-destructive text-xs">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register('confirm')}
            />
            {passwordForm.formState.errors.confirm && (
              <p className="text-destructive text-xs">
                {passwordForm.formState.errors.confirm.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="outline"
            disabled={changePassword.isPending}
          >
            {changePassword.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Change password
          </Button>
        </form>
      </section>
    </div>
  );
}
