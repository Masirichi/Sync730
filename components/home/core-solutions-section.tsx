// components/home/core-solutions-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CoreSolutionsSectionProps {
  onOpenDemo?: () => void;
}

interface TalentPortrait {
  id: string;
  name: string;
  role: string;
  match: string;
  imageUrl: string;
  offsetClass: string;
  stack: string;
}

const LEFT_TALENTS: TalentPortrait[] = [
  {
    id: 'talent-1',
    name: 'Chidi N.',
    role: 'Staff Cloud Architect',
    match: '97% Match',
    stack: 'AWS · Kubernetes · Terraform',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:-translate-y-6 lg:-rotate-2',
  },
  {
    id: 'talent-2',
    name: 'Fatima B.',
    role: 'Distributed Systems Lead',
    match: '96% Match',
    stack: 'Go · Kafka · Microservices',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:translate-y-4 lg:rotate-1',
  },
  {
    id: 'talent-3',
    name: 'Tolu O.',
    role: 'Lead Frontend Engineer',
    match: '95% Match',
    stack: 'React · Next.js · TypeScript',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:-translate-y-2 lg:rotate-2',
  },
  {
    id: 'talent-4',
    name: 'Kwame M.',
    role: 'Senior Full-Stack Engineer',
    match: '94% Match',
    stack: 'Node.js · Postgres · GraphQL',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:translate-y-8 lg:-rotate-1',
  },
];

const RIGHT_TALENTS: TalentPortrait[] = [
  {
    id: 'talent-5',
    name: 'Sarah K.',
    role: 'AI / ML Systems Engineer',
    match: '98% Match',
    stack: 'Python · PyTorch · FastEmbed',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:-translate-y-8 lg:rotate-2',
  },
  {
    id: 'talent-6',
    name: 'Emmanuel A.',
    role: 'DevOps & SRE Specialist',
    match: '95% Match',
    stack: 'Docker · CI/CD · Prometheus',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:translate-y-2 lg:-rotate-2',
  },
  {
    id: 'talent-7',
    name: 'Zainab S.',
    role: 'Mobile Lead Architect',
    match: '96% Match',
    stack: 'Flutter · React Native · iOS',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:-translate-y-4 lg:rotate-1',
  },
  {
    id: 'talent-8',
    name: 'David K.',
    role: 'Backend Platform Engineer',
    match: '94% Match',
    stack: 'Rust · gRPC · Distributed DB',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    offsetClass: 'lg:translate-y-6 lg:-rotate-1',
  },
];

export function CoreSolutionsSection({ onOpenDemo }: CoreSolutionsSectionProps) {
  return (
    <section
      id="core-solutions"
      aria-labelledby="core-solutions-heading"
      className="relative overflow-hidden border-b border-border/70 bg-secondary/15 py-20 sm:py-28 lg:py-36 text-foreground"
    >
      {/* Background Soft Glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] sm:w-[800px] rounded-full bg-purple-500/5 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Responsive Grid: Left Floating Cards | Center Action Block | Right Floating Cards */}
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          {/* LEFT CLOUD: 4 Floating Talent Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-5 order-2 lg:order-1">
            {LEFT_TALENTS.map((talent) => (
              <div
                key={talent.id}
                className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-background bg-card shadow-lg shadow-black/5 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-orange-500/40 ${talent.offsetClass}`}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  <Image
                    src={talent.imageUrl}
                    alt={talent.name}
                    width={400}
                    height={500}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Bottom Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Candidate Details Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{talent.name}</span>
                      <span className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                        {talent.match}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/80 line-clamp-1">{talent.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CENTER CORE: Centralized HR & Recruitment Solutions Action Block */}
          <div className="mx-auto max-w-md text-center order-1 lg:order-2 px-2">
            {/* White / Light Squircle with Purple User Icon (Exact CoreShift Match) */}
            <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl border border-border/80 bg-background shadow-xl shadow-purple-500/10 transition-transform hover:scale-105">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <User className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.5]" />
              </div>
            </div>

            {/* Headline */}
            <h2
              id="core-solutions-heading"
              className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl sm:leading-[1.05] lg:text-[56px] lg:leading-[1.02] text-foreground"
            >
              Core recruitment{' '}
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">
                solutions
              </span>
            </h2>

            {/* Subhead */}
            <p className="mx-auto mt-5 max-w-sm text-sm sm:text-base leading-relaxed text-muted-foreground">
              Streamline technical hiring in one centralized platform, connecting Africa&apos;s top 2% engineers with high-growth teams.
            </p>

            {/* CTA Button: CoreShift Pill */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/solutions"
                className="inline-flex h-11 sm:h-12 items-center justify-center rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] px-8 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <span>Learn more</span>
              </Link>
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex h-11 sm:h-12 items-center justify-center rounded-full border border-border/80 bg-background/90 px-6 text-sm font-semibold text-foreground hover:bg-secondary active:scale-95 transition-all"
              >
                <span>Request a Demo</span>
              </button>
            </div>

            {/* Micro Benefit Checkmarks */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Pre-vetted technical talent</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>72h average time-to-hire</span>
              </span>
            </div>
          </div>

          {/* RIGHT CLOUD: 4 Floating Talent Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-5 order-3">
            {RIGHT_TALENTS.map((talent) => (
              <div
                key={talent.id}
                className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-background bg-card shadow-lg shadow-black/5 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-orange-500/40 ${talent.offsetClass}`}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  <Image
                    src={talent.imageUrl}
                    alt={talent.name}
                    width={400}
                    height={500}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Bottom Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Candidate Details Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{talent.name}</span>
                      <span className="rounded-full bg-orange-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                        {talent.match}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/80 line-clamp-1">{talent.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
