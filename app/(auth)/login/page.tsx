'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, Sparkles, User, Briefcase } from 'lucide-react';

export default function LoginPage() {
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

    const targetUrl = redirectParam || (role === 'recruiter' ? '/recruiter' : role === 'admin' ? '/admin' : '/dashboard/crawler');
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
          .maybeSingle();

        const role = profile?.role || data.user.user_metadata?.role || 'candidate';
        routeUserByRole(role);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  // Instant Demo Access for testing and fast evaluation
  const handleDemoSignIn = (demoRole: 'candidate' | 'recruiter' | 'admin') => {
    routeUserByRole(demoRole);
  };

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
            <Sparkles className="h-3 w-3" /> Sync730 Hub
          </Badge>
        </div>
        <CardDescription>Enter your credentials to sign in to your Sync730 account</CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button className="w-full" size="lg" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          {/* Quick Demo Login Bar for Testing */}
          <div className="pt-3 border-t">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-2">
              ⚡ Instant Demo Access
            </p>
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
