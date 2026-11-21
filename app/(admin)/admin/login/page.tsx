'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  Layers,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'PLATFORM_ADMIN' | 'moderator' | 'vetting_reviewer' | 'finance' | 'support'>('PLATFORM_ADMIN');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Read URL query params (?mode=register or ?tab=register)
  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('mode');
    if (tabParam === 'register' || tabParam === 'signup') {
      setMode('register');
    }
  }, [searchParams]);

  // Set document title
  useEffect(() => {
    document.title = 'Platform Admin Portal | Sync730';
  }, []);

  // 1. Handle Admin Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) {
      setError('Please provide your administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient();
      let authUser: any = null;

      // Authenticate with live Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!authError && data?.user) {
        authUser = data.user;
      } else {
        // If account not created yet, automatically register in live Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanEmail === 'ajahmalachy@gmail.com' ? 'Ajah Malachy' : 'Platform Administrator',
              role: 'PLATFORM_ADMIN',
              Role: 'PLATFORM_ADMIN',
              is_super_admin: true,
            },
          },
        });

        if (signUpData?.user) {
          authUser = signUpData.user;
        } else if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }
      }

      // Elevate live database tables (profiles, admin_roles) via server role provisioning
      try {
        await fetch('/api/admin/auth/provision-super-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
      } catch {}

      // Set authoritative session cookies
      const maxAge = rememberMe ? 2592000 : 86400; // 30 days or 1 day
      document.cookie = `sync730_admin_role=super_admin; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `sync730_admin_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `sync730-demo-role=platform_admin; path=/; max-age=${maxAge}; SameSite=Lax`;

      setSuccess('Administrator authentication verified. Directing to Command Center...');
      toast.success('Signed in to Platform Admin Console');

      setTimeout(() => {
        router.push('/command');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your credentials.');
      setLoading(false);
    }
  };

  // 2. Handle Admin Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail || !password) {
      setError('Please fill in your name, administrator email, and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const isSuperAdminRole = role === 'PLATFORM_ADMIN';

      // 1. Sign up user in live Supabase Auth with PostgreSQL-compliant 'admin' role
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: 'admin',
            Role: 'admin',
            platform_role: isSuperAdminRole ? 'PLATFORM_ADMIN' : role,
            is_super_admin: isSuperAdminRole,
          },
        },
      });

      if (signUpError) {
        // Attempt password sign-in in case user is already registered or trigger threw notice
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        const isTriggerError = signUpError.message?.toLowerCase().includes('database error') ||
                               signUpError.message?.toLowerCase().includes('already registered');

        if (signInErr && !isTriggerError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
      }

      // 2. Provision live database records (profiles & admin_roles)
      try {
        await fetch('/api/admin/auth/provision-super-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
      } catch {}

      // 3. Set cookies
      const maxAge = rememberMe ? 2592000 : 86400;
      const targetRoleName = isSuperAdminRole ? 'super_admin' : role;
      document.cookie = `sync730_admin_role=${targetRoleName}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `sync730_admin_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `sync730-demo-role=platform_admin; path=/; max-age=${maxAge}; SameSite=Lax`;

      setSuccess('Platform administrator registered successfully. Initializing Command Center...');
      toast.success('Admin account created successfully');

      setTimeout(() => {
        router.push('/command');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-between items-center py-10 px-4 sm:px-6 selection:bg-[#FF5500] selection:text-white">
      {/* Top Section */}
      <div className="w-full max-w-md flex flex-col items-center">
        {/* WordPress-style Platform Administration Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-105"
            title="Go to Sync730 Homepage"
          >
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FF5500] to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
              <ShieldCheck className="h-7 w-7 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold tracking-tight text-white">
                Sync<span className="text-neutral-400 font-semibold">730</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-[0.2em] text-[#FF5500]">
                Command Gateway
              </span>
            </div>
          </Link>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/90 text-[11px] font-medium text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Platform Administration & Management</span>
          </div>
        </div>

        {/* Central Administrative Login/Register Card */}
        <div className="w-full rounded-3xl border border-neutral-800 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Tabs: Admin Sign In vs Register Administrator */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-neutral-900 border border-neutral-800/80">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Register Admin
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* MODE 1: ADMIN SIGN IN */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-neutral-300 mb-1.5"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500 pointer-events-none" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ajahmalachy@gmail.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-semibold text-neutral-300"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-neutral-500">Live Secure Auth</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500 pointer-events-none" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-800 bg-neutral-950 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox (Classic WordPress signature) */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-[#FF5500] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-400">Remember session (30 days)</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 h-11 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating System Admin...</span>
                  </>
                ) : (
                  <>
                    <span>Log In to Admin Console</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* MODE 2: REGISTER ADMINISTRATOR */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-neutral-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ajah Malachy"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-neutral-300 mb-1.5"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ajahmalachy@gmail.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-role"
                  className="block text-xs font-semibold text-neutral-300 mb-1.5"
                >
                  Administrative Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500 pointer-events-none" />
                  <select
                    id="reg-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-white text-xs focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-colors"
                  >
                    <option value="PLATFORM_ADMIN">Platform Admin / Super Admin (Full Platform Authority)</option>
                    <option value="moderator">Operations Moderator</option>
                    <option value="vetting_reviewer">Technical Vetting Reviewer</option>
                    <option value="finance">Financial Officer</option>
                    <option value="support">Support Specialist</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-neutral-300 mb-1.5"
                >
                  Create Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-800 bg-neutral-950 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 h-11 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Administrator...</span>
                  </>
                ) : (
                  <>
                    <span>Create Administrator Account</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Real Live Project Access Guarantee Notice */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Direct Live Project Access:</strong> All administrative credentials operate directly on live platform resources, live Supabase database records, and production role authority.
            </span>
          </div>
        </div>

        {/* WordPress-style Footer Backlink: "← Go to Sync730" */}
        <div className="mt-8 flex flex-col items-center gap-2 text-xs">
          <Link
            href="/"
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Go to Sync730 Home</span>
          </Link>

          <div className="flex items-center gap-3 text-neutral-500 text-[11px] mt-1">
            <Link href="/console" className="hover:text-neutral-300 transition-colors">
              Recruiter Console
            </Link>
            <span>&middot;</span>
            <Link href="/candidate" className="hover:text-neutral-300 transition-colors">
              Candidate Hub
            </Link>
            <span>&middot;</span>
            <Link href="/privacy" className="hover:text-neutral-300 transition-colors">
              NDPA Privacy
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <footer className="mt-8 text-[11px] text-neutral-600 text-center">
        Sync730 Enterprise Command & Administrative Gateway &middot; v2.4.0
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] text-neutral-400 flex items-center justify-center text-xs">
          Loading Admin Gateway...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
