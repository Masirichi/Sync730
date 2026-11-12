'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/site/brand-logo';
import { Building2, ShieldCheck, Users, Zap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isB2B = pathname.startsWith('/signup/company') || pathname.startsWith('/register/recruiter');

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Left Branding Panel (Desktop) */}
      <aside aria-label="Brand introduction" className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex xl:p-14 select-none">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-background/20" />
        <div className="absolute bottom-24 right-20 h-40 w-40 rounded-full bg-background/5" />
        
        {/* Top Logo */}
        <div className="relative flex items-center justify-between">
          <BrandLogo inverted />
          {isB2B && (
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/20">
              Enterprise B2B
            </span>
          )}
        </div>

        {/* Dynamic Center Branding Content */}
        {isB2B ? (
          <div className="relative max-w-lg space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-background/50">
                Verified Remote Talent Network
              </p>
              <h2 className="mt-4 text-3xl xl:text-4xl font-semibold leading-tight tracking-[-0.03em] text-white">
                Hire vetted technical talent with verified AI rubrics.
              </h2>
              <p className="mt-4 leading-relaxed text-background/70 text-sm xl:text-base">
                Skip hundreds of unqualified resumes. Review real candidate video assessments, code depth scores, and unlock candidate dossiers on demand.
              </p>
            </div>

            {/* B2B Value Proposition Cards */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Zap className="h-4 w-4 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    2 Free Trial Candidate Unlocks
                  </h4>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                    Every new workspace receives 2 complimentary tokens to unlock complete candidate dossiers and contact info.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                  <ShieldCheck className="h-4 w-4 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Flowmingo-Powered Video Rubrics
                  </h4>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                    Standardized AI evaluation across technical depth, system design, and communication.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                  <Users className="h-4 w-4 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Role-Based Workspace Access
                  </h4>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                    Invite hiring managers and interviewers with granular viewing and note-taking privileges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-background/50">
              The work network for what comes next
            </p>
            <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em]">
              Where good work and good people meet.
            </h2>
            <p className="mt-5 leading-7 text-background/60">
              A more thoughtful way to find opportunities, build teams, and make your next move.
            </p>
          </div>
        )}

        <p className="relative text-sm text-background/70">© 2026 Sync730</p>
      </aside>

      {/* Right Form Area (Wider container with ample breathing room) */}
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto outline-none">
        <div className="w-full max-w-lg">
          <div className="mb-6 lg:hidden flex justify-center">
            <BrandLogo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
