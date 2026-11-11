'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Lock,
  Mail,
  User,
  Zap,
  ArrowRight,
  Loader2,
  Users,
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
    <div className="space-y-4 w-full">
      {/* Top Banner Navigation / Role Toggle */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="inline-flex w-full rounded-xl p-1 bg-neutral-100 dark:bg-neutral-800">
          <Link
            href="/register"
            className="flex-1 text-center px-3 py-1.5 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Looking for a Job? (Candidate)
          </Link>
          <div className="flex-1 text-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs flex items-center justify-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Hiring Talent? (Company)</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Creation Card */}
      <Card className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-lg bg-white dark:bg-neutral-900">
        <CardContent className="p-6 sm:p-7 space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold mb-2">
              <Zap className="h-3 w-3 stroke-[2]" />
              <span>2 Free Trial Tokens Included</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Create your Employer Workspace
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Start vetting pre-vetted African tech candidates immediately. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Full Name & Work Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    placeholder="alex@acmecorp.com"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    className="pl-9 h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Company / Agency Name */}
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

            {/* Row 3: Company Size & Industry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Company Size
                </Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10 Employees">1-10 Employees (Startup)</SelectItem>
                    <SelectItem value="10-50 Employees">10-50 Employees (Growth)</SelectItem>
                    <SelectItem value="50-200 Employees">50-200 Employees (Mid-Market)</SelectItem>
                    <SelectItem value="200+ Employees">200+ Employees (Enterprise)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Primary Industry
                </Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology & Software">Technology & Software</SelectItem>
                    <SelectItem value="Fintech & Payments">Fintech & Payments</SelectItem>
                    <SelectItem value="Healthtech">Healthtech</SelectItem>
                    <SelectItem value="E-Commerce & Retail">E-Commerce & Retail</SelectItem>
                    <SelectItem value="AI & Machine Learning">AI & Machine Learning</SelectItem>
                    <SelectItem value="Staffing & Agency">Staffing & Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Password */}
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
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>
            </div>

            {/* Trial Perks Box */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[1.5]" />
              <span>
                Includes <strong>2 Free Candidate Unlocks</strong> and instant workspace access.
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 font-semibold text-xs tracking-tight shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing Workspace...
                </>
              ) : (
                <>
                  Create Employer Workspace (2 Free Unlocks)
                  <ArrowRight className="ml-2 h-3.5 w-3.5 stroke-[1.5]" />
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
              By creating a workspace, you agree to the{' '}
              <a href="#" className="underline hover:text-neutral-800">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline hover:text-neutral-800">
                Privacy Policy
              </a>
              .
            </p>
          </form>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Already have an employer account?{' '}
              <Link href="/login" className="font-semibold text-neutral-900 dark:text-white hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
