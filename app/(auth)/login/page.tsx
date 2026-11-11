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
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription>
          Sign in to access your pre-vetted remote career ecosystem
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="candidate@sync730.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
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
          <div className="pt-3 border-t">
            <div className="text-center mb-2.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Instant Demo Access (Local / Dev)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => handleDemoSignIn('candidate')}
              >
                <User className="h-3.5 w-3.5 text-primary" />
                Demo Candidate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => handleDemoSignIn('recruiter')}
              >
                <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                Demo Recruiter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="col-span-2 gap-1.5 text-xs h-8 bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-700"
                onClick={() => handleDemoSignIn('platform_admin')}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
                Demo Platform Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </form>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-medium text-primary hover:underline">
            Sign up
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
