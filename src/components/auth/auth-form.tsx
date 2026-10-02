'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SocialAuth } from './social-auth';

// Mirrors the backend DTOs so the client rejects what the API would reject.
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, token, hydrated } = useAuthStore();

  const isRegister = mode === 'register';
  const next = params.get('next');
  const destination = next && next.startsWith('/') ? next : '/dashboard';

  const form = useForm<RegisterValues>({
    resolver: zodResolver(
      (isRegister ? registerSchema : loginSchema) as typeof registerSchema,
    ),
    defaultValues: { name: '', email: '', password: '' },
  });

  // Already signed in? Nothing to do here.
  useEffect(() => {
    if (hydrated && token) router.replace(destination);
  }, [hydrated, token, router, destination]);

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      isRegister
        ? authApi.register(values)
        : authApi.login({ email: values.email, password: values.password }),
    onSuccess: (auth) => {
      signIn(auth);
      toast.success(
        isRegister
          ? `Welcome, ${auth.user.name}`
          : `Welcome back, ${auth.user.name}`,
      );
      router.replace(destination);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const onSubmit = (values: RegisterValues) => mutation.mutate(values);

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isRegister ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {isRegister
          ? 'Start learning in under a minute.'
          : 'Log in to continue where you left off.'}
      </p>

      <SocialAuth mode={mode} next={next} />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        {isRegister && (
          <Field
            id="name"
            label="Name"
            autoComplete="name"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
        )}

        <Field
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />

        <Field
          id="password"
          type="password"
          label="Password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          {isRegister ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <Link
          href={isRegister ? '/login' : '/register'}
          className="text-foreground font-medium underline underline-offset-4"
        >
          {isRegister ? 'Log in' : 'Sign up'}
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
