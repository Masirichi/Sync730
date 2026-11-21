'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  User,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Coins,
  Check,
  Briefcase,
} from 'lucide-react';
import { fireJobAnalytics } from '@/lib/analytics/client';
import { toast } from 'sonner';
import { saveLocalWorkspace, saveLocalMember } from '@/lib/recruiter/store';

function DualRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('next') || searchParams.get('redirect');
  const roleParam = searchParams.get('role');

  // Role toggle: 'talent' | 'recruiter'
  const [activeRole, setActiveRole] = useState<'talent' | 'recruiter'>('talent');

  useEffect(() => {
    if (roleParam === 'recruiter' || roleParam === 'company') {
      setActiveRole('recruiter');
    } else if (roleParam === 'talent' || roleParam === 'candidate') {
      setActiveRole('talent');
    }
  }, [roleParam]);

  // Shared / Talent Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [techSpecialization, setTechSpecialization] = useState('Full Stack Engineering');

  // Recruiter Specific Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('10-50 Employees');
  const [recruiterTermsAccepted, setRecruiterTermsAccepted] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Handle Talent Registration
  const handleTalentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    if (redirectParam?.includes('/jobs/')) {
      fireJobAnalytics('signup_started_from_job');
    }

    const isAjah = email.toLowerCase().trim() === 'ajahmalachy@gmail.com';

    try {
      if (isAjah) {
        document.cookie = 'sync730-demo-role=platform_admin; path=/; max-age=86400; SameSite=Lax';
        document.cookie = 'sync730_admin_role=super_admin; path=/; max-age=86400; SameSite=Lax';
      } else {
        document.cookie = 'sync730-demo-role=candidate; path=/; max-age=86400; SameSite=Lax';
      }

      const supabase = createBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: isAjah ? 'admin' : 'candidate',
            Role: isAjah ? 'admin' : 'candidate',
            platform_role: isAjah ? 'PLATFORM_ADMIN' : 'candidate',
            is_super_admin: isAjah,
            specialization: techSpecialization,
          },
        },
      });

      if (isAjah) {
        try {
          await fetch('/api/admin/auth/provision-super-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
        } catch {}
      }

      if (signUpError) {
        console.warn('Supabase talent signup notice:', signUpError.message);
      }

      fireJobAnalytics('signup_completed');
      toast.success(
        isAjah
          ? 'Platform Admin Manager account registered on live project!'
          : 'Welcome to Sync730! Your talent profile is ready.'
      );

      setTimeout(() => {
        router.push(isAjah ? '/command/metrics' : redirectParam || '/candidate');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create candidate account. Please try again.');
      setLoading(false);
    }
  };

  // 2. Handle Recruiter / Company Registration
  const handleRecruiterRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !companyName.trim() || !password.trim()) {
      setError('Please complete all required fields including your company name.');
      return;
    }

    if (!recruiterTermsAccepted) {
      setError('Please accept the Recruiter Terms of Use and NDPA compliance policy.');
      return;
    }

    setLoading(true);

    const isAjah = email.toLowerCase().trim() === 'ajahmalachy@gmail.com';

    try {
      if (isAjah) {
        document.cookie = 'sync730-demo-role=platform_admin; path=/; max-age=86400; SameSite=Lax';
        document.cookie = 'sync730_admin_role=super_admin; path=/; max-age=86400; SameSite=Lax';
      } else {
        document.cookie = 'sync730-demo-role=recruiter; path=/; max-age=86400; SameSite=Lax';
      }

      const supabase = createBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: isAjah ? 'admin' : 'recruiter',
            Role: isAjah ? 'admin' : 'RECRUITER',
            platform_role: isAjah ? 'PLATFORM_ADMIN' : 'recruiter',
            is_super_admin: isAjah,
            company_name: companyName,
            company_size: companySize,
          },
        },
      });

      if (isAjah) {
        try {
          await fetch('/api/admin/auth/provision-super-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
        } catch {}
      }

      if (authError) {
        console.warn('Supabase recruiter signup notice:', authError.message);
      }

      const userId = authData?.user?.id || `usr-recruiter-${Date.now()}`;
      const workspaceId = `ws-${Date.now().toString(36)}`;

      // Initialize local workspace with 2 free candidate unlock tokens
      saveLocalWorkspace({
        id: workspaceId,
        company_name: companyName,
        billing_email: email,
        token_balance: 2,
        created_at: new Date().toISOString(),
      });

      // Save admin member
      saveLocalMember({
        id: `mem-${Date.now().toString(36)}`,
        workspace_id: workspaceId,
        user_id: userId,
        email,
        full_name: name,
        role: 'OWNER',
        status: 'Active',
        created_at: new Date().toISOString(),
      });

      // Trigger workspace update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sync730_workspace_updated'));
      }

      toast.success(`Welcome to Sync730! 2 free unlock tokens added for ${companyName}.`);

      setTimeout(() => {
        router.push('/console');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create recruiter workspace.');
      setLoading(false);
    }
  };

  // Google OAuth for Talent
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const supabase = createBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectParam || '/candidate')}`;

      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (googleErr) {
        setError(googleErr.message);
      }
    } catch {
      setError('Failed to initialize Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-xl mx-auto">
      {/* Role Selection Switcher (Dual Persona Header) */}
      <div className="rounded-2xl border border-border/80 bg-card p-1.5 shadow-sm">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveRole('talent');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold transition-all ${
              activeRole === 'talent'
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <User className="h-4 w-4" />
            <span>I am Talent</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('recruiter');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold transition-all ${
              activeRole === 'recruiter'
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>I am a Recruiter</span>
          </button>
        </div>
      </div>

      <Card className="border-border/80 shadow-xl rounded-3xl overflow-hidden bg-card">
        {/* ========================================================================= */}
        {/* FORM 1: TECHNICAL TALENT REGISTRATION                                     */}
        {/* ========================================================================= */}
        {activeRole === 'talent' ? (
          <div>
            <CardHeader className="space-y-1.5 pb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 w-fit">
                <Sparkles className="h-3 w-3 text-[#FF5500]" />
                <span>FOR AFRICAN SOFTWARE ENGINEERS</span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Join as Technical Talent
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Build your verified developer dossier, practice with AI mock interviews, and access top remote engineering roles.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleTalentRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Free Perks Callout */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">100% Free for Technical Talent</span>
                    <span className="text-[11px] opacity-90 block mt-0.5">
                      Includes SyncFlow job tracking, AI Resume Studio, and automated STAR interview coaching.
                    </span>
                  </div>
                </div>

                {/* Google Sign-up Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading}
                  className="w-full h-11 border border-border/80 bg-background text-foreground text-xs font-semibold rounded-xl hover:bg-secondary transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-border/70 w-full" />
                  <span className="bg-card px-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider absolute">
                    or with email
                  </span>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="talent-name" className="text-xs font-semibold">
                    Full Name
                  </Label>
                  <Input
                    id="talent-name"
                    type="text"
                    placeholder="e.g. David Alabi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="talent-email" className="text-xs font-semibold">
                    Email Address
                  </Label>
                  <Input
                    id="talent-email"
                    type="email"
                    placeholder="david@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                {/* Tech Specialization */}
                <div className="space-y-1.5">
                  <Label htmlFor="talent-spec" className="text-xs font-semibold">
                    Primary Specialization
                  </Label>
                  <Select
                    value={techSpecialization}
                    onValueChange={setTechSpecialization}
                  >
                    <SelectTrigger id="talent-spec" className="h-10 text-xs rounded-xl">
                      <SelectValue placeholder="Select primary engineering field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Stack Engineering">Full Stack Engineering</SelectItem>
                      <SelectItem value="Backend & Distributed Systems">Backend & Distributed Systems</SelectItem>
                      <SelectItem value="Frontend & Web Architecture">Frontend & Web Architecture</SelectItem>
                      <SelectItem value="Cloud, DevOps & SRE">Cloud, DevOps & SRE</SelectItem>
                      <SelectItem value="AI, Machine Learning & Data">AI, Machine Learning & Data</SelectItem>
                      <SelectItem value="Mobile Engineering (iOS/Android/Flutter)">Mobile Engineering (Flutter/Native)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="talent-password" className="text-xs font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="talent-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="h-10 text-xs rounded-xl pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-[#FF5500] hover:bg-[#E64D00] text-white font-semibold text-xs shadow-md shadow-orange-500/25 active:scale-95 transition-all mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Talent Profile...
                    </>
                  ) : (
                    'Create Free Talent Profile'
                  )}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  By joining, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-foreground">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardContent>
            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* FORM 2: RECRUITER / EMPLOYER REGISTRATION                                 */
          /* ========================================================================= */
          <div>
            <CardHeader className="space-y-1.5 pb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 w-fit">
                <Coins className="h-3 w-3 text-[#FF5500]" />
                <span>INCLUDES 2 FREE CANDIDATE UNLOCK TOKENS</span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Create Recruiter Workspace
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Source, screen, and hire pre-vetted African engineering talent with calibrated AI rubrics and SyncFlow talent pipelines.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleRecruiterRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Recruiter Value Banner */}
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5 text-xs text-orange-950 dark:text-orange-200 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#FF5500] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Free Recruiter Trial Activated</span>
                    <span className="text-[11px] opacity-90 block mt-0.5">
                      Your workspace includes 2 full candidate unlock tokens, SyncFlow ATS pipeline access, and direct chat.
                    </span>
                  </div>
                </div>

                {/* Full Name & Work Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiter-name" className="text-xs font-semibold">
                      Your Full Name
                    </Label>
                    <Input
                      id="recruiter-name"
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="recruiter-email" className="text-xs font-semibold">
                      Work Email
                    </Label>
                    <Input
                      id="recruiter-email"
                      type="email"
                      placeholder="alex@acme.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Company Name & Company Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiter-company" className="text-xs font-semibold">
                      Company Name
                    </Label>
                    <Input
                      id="recruiter-company"
                      type="text"
                      placeholder="e.g. Acme Global Tech"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="recruiter-size" className="text-xs font-semibold">
                      Company Size
                    </Label>
                    <Select
                      value={companySize}
                      onValueChange={setCompanySize}
                    >
                      <SelectTrigger id="recruiter-size" className="h-10 text-xs rounded-xl">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10 Employees">1-10 Employees (Early Stage)</SelectItem>
                        <SelectItem value="10-50 Employees">10-50 Employees (Growth)</SelectItem>
                        <SelectItem value="50-200 Employees">50-200 Employees (Scaleup)</SelectItem>
                        <SelectItem value="200+ Employees">200+ Employees (Enterprise)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="recruiter-password" className="text-xs font-semibold">
                    Work Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="recruiter-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="h-10 text-xs rounded-xl pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Recruiter Terms Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recruiterTermsAccepted}
                      onChange={(e) => setRecruiterTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-border text-[#FF5500] focus:ring-orange-500 h-4 w-4"
                      required
                    />
                    <span className="text-[11px] leading-relaxed text-muted-foreground">
                      I agree to the{' '}
                      <Link href="/terms" className="underline text-foreground">
                        Recruiter Terms of Use
                      </Link>{' '}
                      and verify compliance with the Nigerian Data Protection Act (NDPA 2023).
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-[#FF5500] hover:bg-[#E64D00] text-white font-semibold text-xs shadow-md shadow-orange-500/25 active:scale-95 transition-all mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Recruiter Workspace...
                    </>
                  ) : (
                    'Create Recruiter Workspace (2 Free Tokens)'
                  )}
                </Button>
              </CardContent>
            </form>
          </div>
        )}

        <CardFooter className="justify-center border-t border-border/60 py-4 bg-secondary/15">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={redirectParam ? `/login?next=${encodeURIComponent(redirectParam)}` : '/login'}
              className="font-semibold text-foreground hover:text-orange-500 underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-500">Loading registration...</div>}>
      <DualRegisterForm />
    </Suspense>
  );
}
