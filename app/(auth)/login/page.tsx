'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, User, Briefcase, ShieldCheck, Clock } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('next') || searchParams.get('redirect');
  const isTimeout = searchParams.get('timeout') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDevEnvironment = process.env.NODE_ENV !== 'production';

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
        // Record failed attempt and check sliding-window rate limit (5 attempts per 15 min)
        try {
          const rateRes = await fetch('/api/auth/login-rate-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, success: false }),
          });
          const rateData = await rateRes.json();
          if (!rateData.allowed) {
            setError(rateData.error || 'Too many failed login attempts. Please try again in 15 minutes.');
            setLoading(false);
            return;
          }
        } catch {}

        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Reset rate limit on success
        try {
          await fetch('/api/auth/login-rate-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, success: true }),
          });
        } catch {}

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
          {/* Inactivity Timeout Banner */}
          {isTimeout && (
            <div
              role="status"
              className="flex items-center gap-2 p-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 rounded-xl border border-amber-500/20"
            >
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Your session expired due to 30 minutes of inactivity. Please sign in again.</span>
            </div>
          )}

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

          {/* Instant Demo Access without registration to test features and updates */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-center mb-2.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                Instant Demo Access (Test Features & Updates)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href="/api/auth/demo-login?role=platform_admin&redirect=/command/metrics" className="col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 text-xs min-h-[44px] bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 border-neutral-700 shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                  <span className="font-bold">Sign In as Demo Admin (Command Center)</span>
                </Button>
              </a>
              <a href="/api/auth/demo-login?role=recruiter&redirect=/console/talent">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-1.5 text-xs min-h-[44px] border-neutral-200 dark:border-neutral-800"
                >
                  <Briefcase className="h-4 w-4 text-amber-500" />
                  <span>Demo Recruiter</span>
                </Button>
              </a>
              <a href="/api/auth/demo-login?role=candidate&redirect=/dashboard/crawler">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-1.5 text-xs min-h-[44px] border-neutral-200 dark:border-neutral-800"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span>Demo Candidate</span>
                </Button>
              </a>
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
