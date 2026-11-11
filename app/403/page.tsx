import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#0e0e11] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl space-y-6">
        {/* Shield Alert Icon */}
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 stroke-[1.5]" />
        </div>

        {/* Brand Text */}
        <div>
          <span className="text-xl tracking-tight">
            <span className="font-extrabold text-white">Sync</span>
            <span className="font-semibold text-neutral-400">730</span>
          </span>
          <div className="text-[10px] uppercase font-bold tracking-widest text-rose-400 mt-1">
            Access Control Restriction
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            403 - Access Forbidden
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The Platform Admin Command Center is strictly restricted to authenticated accounts with{' '}
            <code className="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40 font-mono text-[11px]">
              role === &apos;PLATFORM_ADMIN&apos;
            </code>
            . Your account does not have sufficient clearance to access this terminal.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          <Link href="/login?redirect=/command/metrics" className="block">
            <Button className="w-full h-10 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-200 font-semibold text-xs gap-2">
              <LogIn className="h-4 w-4 stroke-[1.5]" />
              <span>Sign In with Platform Admin Credentials</span>
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard/crawler">
              <Button
                variant="outline"
                className="w-full h-9 rounded-xl border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800"
              >
                Candidate View
              </Button>
            </Link>
            <Link href="/console/jobs">
              <Button
                variant="outline"
                className="w-full h-9 rounded-xl border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800"
              >
                Recruiter Console
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
