'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, User, Briefcase, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeUserByRole = (role: string) => {
    // Set demo cookie so middleware recognizes session in local testing
    if (typeof document !== 'undefined') {
      document.cookie = `sync730-demo-role=${role}; path=/; max-age=86400; SameSite=Lax`;
    }

    const lower = role.toLowerCase();
    const targetUrl =
      redirectParam ||
      (lower === 'platform_admin' || lower === 'admin'
        ? '/command/metrics'
        : lower === 'recruiter'
        ? '/console/jobs'
        : '/dashboard/crawler');
    window.location.href = targetUrl;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'candidate';
        routeUserByRole(role);
      }
    } catch {
      setError('An unexpected error occurred during sign in.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = (role: 'candidate' | 'recruiter' | 'platform_admin') => {
    routeUserByRole(role);
  };

  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Welcome back
        </h1>
        <CardDescription className="text-sm text-neutral-600 dark:text-neutral-400">
          Sign in to access your pre-vetted remote career ecosystem
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="candidate@sync730.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] text-base sm:text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Password
              </Label>
              <a
                href="/forgot-password"
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors underline"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] text-base sm:text-sm"
              required
            />
          </div>

          <Button type="submit" className="w-full min-h-[44px] text-sm font-semibold" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Quick Demo Switcher for Evaluation */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-center mb-2.5">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Instant Demo Access (Local / Dev)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 text-xs min-h-[44px] border-neutral-200 dark:border-neutral-800"
                onClick={() => handleDemoSignIn('candidate')}
              >
                <User className="h-4 w-4 text-primary" />
                <span>Demo Candidate</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 text-xs min-h-[44px] border-neutral-200 dark:border-neutral-800"
                onClick={() => handleDemoSignIn('recruiter')}
              >
                <Briefcase className="h-4 w-4 text-amber-500" />
                <span>Demo Recruiter</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="col-span-2 gap-1.5 text-xs min-h-[44px] bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-700"
                onClick={() => handleDemoSignIn('platform_admin')}
              >
                <ShieldCheck className="h-4 w-4 text-rose-400" />
                <span>Demo Platform Admin</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </form>

      <CardFooter className="justify-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-semibold text-neutral-900 dark:text-neutral-100 hover:underline">
            Sign up for Sync730
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border/80 shadow-lg p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading login...</p>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
