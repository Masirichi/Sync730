'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Briefcase,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Users,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { saveLocalWorkspace, saveLocalMember } from '@/lib/recruiter/store';

export default function CompanySignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('10-50 Employees');
  const [industry, setIndustry] = useState('Technology & Software');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const resolvedName = (fullName || (formData.get('full_name') as string) || '').trim();
    const resolvedEmail = (workEmail || (formData.get('work_email') as string) || '').trim();
    const resolvedCompany = (companyName || (formData.get('company_name') as string) || '').trim();
    const resolvedPassword = (password || (formData.get('password') as string) || '').trim();

    if (!resolvedName || !resolvedEmail || !resolvedCompany || !resolvedPassword) {
      toast.error('Please complete all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Set demo cookie early to guarantee immediate SSR permissions
      document.cookie = 'sync730-demo-role=recruiter; path=/; max-age=86400; SameSite=Lax';

      const supabase = createBrowserClient();

      // 1. Register with Supabase Auth passing role in user_metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: resolvedEmail,
        password: resolvedPassword,
        options: {
          data: {
            full_name: resolvedName,
            role: 'recruiter',
            Role: 'RECRUITER',
            company_name: resolvedCompany,
            company_size: companySize,
            industry,
          },
        },
      });

      if (authError) {
        console.warn('Notice: Supabase signUp notice:', authError.message);
      }

      const userId = authData?.user?.id || `user-recruiter-${Date.now()}`;

      // 2. Create Corporate Workspace with 2 free trial tokens
      const wsRes = await fetch('/api/recruiter/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: resolvedCompany,
          billing_email: resolvedEmail,
          token_balance: 2,
          industry,
          company_size: companySize,
        }),
      });

      const wsJson = await wsRes.json();
      const workspace = wsJson.workspace || {
        id: `ws-${Date.now().toString(36)}`,
        company_name: resolvedCompany,
        billing_email: resolvedEmail,
        token_balance: 2,
        industry,
        company_size: companySize,
        created_at: new Date().toISOString(),
      };

      // 3. Link user as OWNER
      saveLocalMember({
        id: `mem-${Date.now().toString(36)}`,
        workspace_id: workspace.id,
        user_id: userId,
        role: 'OWNER',
        email: resolvedEmail,
        full_name: resolvedName,
        created_at: new Date().toISOString(),
      });

      toast.success(`Welcome to Sync730! 2 trial unlock tokens added for ${resolvedCompany}.`);

      // 4. Redirect straight to /console/jobs
      window.location.assign('/console/jobs');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Failed to complete registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Banner Navigation / Role Toggle */}
      <div className="max-w-4xl mx-auto w-full mb-6">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Select registration portal:
            </span>
          </div>
          <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-neutral-800">
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Looking for a Job? (Candidate)
            </Link>
            <div className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>Hiring Talent? (Company)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Value Props Column */}
        <div className="lg:col-span-5 space-y-6 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs tracking-tight">
                S
              </div>
              <span className="text-xl tracking-tight">
                <span className="font-extrabold text-neutral-900 dark:text-white">Sync</span>
                <span className="font-semibold text-neutral-400 dark:text-neutral-500">730</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                Enterprise B2B
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Hire vetted technical talent with verified AI rubrics.
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Skip hundreds of unqualified resumes. Review real candidate video assessments, code depth scores, and unlock candidate dossiers on demand.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Zap className="h-4 w-4 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  2 Free Trial Candidate Unlocks
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Every new employer workspace receives 2 complimentary tokens to unlock complete candidate contact details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <ShieldCheck className="h-4 w-4 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Flowmingo-Powered Video Rubrics
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Standardized AI evaluation across technical depth, system architecture, and real-time communication.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80">
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shrink-0">
                <Users className="h-4 w-4 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Role-Based Team Access
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Invite hiring managers and technical interviewers with granular viewing and note-taking privileges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Create your Employer Workspace
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Start vetting candidates immediately. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
                  <Input
                    name="full_name"
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Work Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
                  <Input
                    name="work_email"
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    className="pl-9 h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Company / Agency Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
                <Input
                  name="company_name"
                  type="text"
                  required
                  placeholder="Acme Global Technologies"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Company Size
                </Label>
                <select
                  name="company_size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                >
                  <option value="1-10 Employees">1-10 Employees (Early Stage)</option>
                  <option value="10-50 Employees">10-50 Employees (Growth)</option>
                  <option value="50-200 Employees">50-200 Employees (Scale-up)</option>
                  <option value="200+ Employees">200+ Employees (Enterprise)</option>
                  <option value="Hiring Agency">Hiring / Recruitment Agency</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Primary Industry
                </Label>
                <select
                  name="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                >
                  <option value="Technology & Software">Technology & Software</option>
                  <option value="Fintech & Banking">Fintech & Financial Services</option>
                  <option value="E-commerce & Retail">E-commerce & Retail</option>
                  <option value="Healthcare & Bio">Healthcare & Healthtech</option>
                  <option value="Consulting & Agency">Consulting & Staffing</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
                <Input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>
              <p className="text-[11px] text-neutral-400">Must be at least 6 characters</p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold text-xs rounded-xl shadow-xs gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                    <span>Activating Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create Company Workspace & Get 2 Free Tokens</span>
                    <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pt-2 text-xs text-neutral-500">
              Already have an employer account?{' '}
              <Link href="/login" className="font-semibold text-neutral-900 dark:text-white underline hover:no-underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
