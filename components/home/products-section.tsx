// components/home/products-section.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Activity,
  Sparkles,
  Mail,
  ArrowRight,
  TrendingUp,
  Users2,
  CheckCircle2,
  ChevronDown,
  Compass,
  Briefcase,
  Zap,
} from 'lucide-react';
import { homeCopy } from '@/content/home';

// Roster of authentic African technical talents
interface TalentCandidate {
  name: string;
  role: string;
  avatar: string;
  matchScore: string;
}

const TALENT_POOLS: Record<string, TalentCandidate[]> = {
  engineering: [
    {
      name: 'Chidi Nwamadi',
      role: 'Staff Cloud Architect',
      avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '98%',
    },
    {
      name: 'Fatima Bello',
      role: 'Distributed Systems Lead',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '96%',
    },
    {
      name: 'Kwame Mensah',
      role: 'Senior Full-Stack Engineer',
      avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '95%',
    },
  ],
  aiml: [
    {
      name: 'Sarah Kamau',
      role: 'AI / ML Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '98%',
    },
    {
      name: 'Babajide Adeleke',
      role: 'DevOps & SRE Specialist',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '97%',
    },
    {
      name: 'Amina Okonkwo',
      role: 'Backend Platform Engineer',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '96%',
    },
  ],
  product: [
    {
      name: 'Tolu Olatunji',
      role: 'Lead Product Engineer',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '96%',
    },
    {
      name: 'Zainab Sani',
      role: 'Mobile Lead Architect',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '95%',
    },
    {
      name: 'Chidi Nwamadi',
      role: 'Staff Systems Architect',
      avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=120&h=120&q=80',
      matchScore: '98%',
    },
  ],
};

// 8 African Talents in the Circular Orbit
const ORBIT_TALENTS = [
  { id: '1', name: 'Chidi N.', avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=120&h=120&q=80' },
  { id: '2', name: 'Fatima B.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80' },
  { id: '3', name: 'Kwame M.', avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=120&h=120&q=80' },
  { id: '4', name: 'Tolu O.', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&h=120&q=80' },
  { id: '5', name: 'Babajide A.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80' },
  { id: '6', name: 'Sarah K.', avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=120&h=120&q=80' },
  { id: '7', name: 'Zainab S.', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&h=120&q=80' },
  { id: '8', name: 'Amina O.', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=120&h=120&q=80' },
];

export function ProductsSection() {
  const products = homeCopy.products || {
    label: 'THE AI RECRUITMENT ENGINE',
    h2: 'Built for everyone',
    sub: 'Connecting high-growth hiring teams and top African technical talent through real-time marketplace outreach, AI evaluations, and swift recruitment timelines.',
    items: [],
  };

  const [activeTab, setActiveTab] = useState<'engineering' | 'aiml' | 'product'>('engineering');

  const candidates = TALENT_POOLS[activeTab] || TALENT_POOLS.engineering;

  return (
    <section
      id="products"
      aria-labelledby="products-heading"
      className="scroll-mt-20 border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* ========================================================================= */}
        {/* PART 1: Top Header & 3 Bento Cards (Inspired by Reference Image 2)        */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Eyebrow with CoreShift orange ping */}
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span>{products.label || 'THE AI RECRUITMENT ENGINE'}</span>
          </div>

          {/* CoreShift H1 Headline */}
          <h2
            id="products-heading"
            className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground"
          >
            Built for everyone
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {products.sub ||
              'Connecting high-growth hiring teams and top African technical talent through real-time marketplace outreach, AI evaluations, and swift recruitment timelines.'}
          </p>
        </div>

        {/* Top 3 Bento Cards */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1: For hiring managers & recruiters (Reference: Left card with evaluation report) */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="group relative rounded-3xl border border-border/80 bg-card p-7 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
          >
            {/* Visual Container: Attendance / Evaluation Report Chart */}
            <div className="h-60 sm:h-64 relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-muted/30 to-muted/5 p-4">
              {/* Background Faded Mockup Cards for 3D Carousel Depth */}
              <div className="absolute -left-12 w-48 h-44 rounded-2xl border border-border/40 bg-card/40 opacity-30 -rotate-6 scale-90 pointer-events-none" />
              <div className="absolute -right-12 w-48 h-44 rounded-2xl border border-border/40 bg-card/40 opacity-30 rotate-6 scale-90 pointer-events-none" />

              {/* Central Floating Evaluation Report Window */}
              <div className="relative z-10 w-full max-w-[245px] rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md p-4 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-border/60">
                  <span className="font-semibold text-foreground tracking-tight">Evaluation Report</span>
                  <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full border border-border/70 bg-muted/50 flex items-center gap-1 font-medium">
                    Monthly <ChevronDown className="h-2.5 w-2.5" />
                  </span>
                </div>

                {/* Vertical Bar Chart with Peak Metric */}
                <div className="relative pt-6 pb-1">
                  {/* Subtle Dotted Threshold Guide */}
                  <div className="absolute top-12 left-0 right-0 border-t border-dashed border-border/80" />

                  <div className="flex items-end justify-between gap-2.5 h-24 px-1">
                    {/* Mon */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-full h-11 rounded-t-md bg-muted-foreground/20 overflow-hidden flex flex-col justify-end">
                        <div className="w-full h-5 bg-orange-500/40" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">Mon</span>
                    </div>

                    {/* Tue */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-full h-16 rounded-t-md bg-muted-foreground/25 overflow-hidden flex flex-col justify-end">
                        <div className="w-full h-8 bg-orange-500/60" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">Tue</span>
                    </div>

                    {/* Wed - Primary Prominent Peak with Floating +45% Badge */}
                    <div className="flex flex-col items-center gap-1.5 flex-1 relative">
                      {/* Floating Tooltip Pill */}
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 z-20"
                      >
                        <div className="relative bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md tracking-tight whitespace-nowrap">
                          +45%
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-white" />
                        </div>
                      </motion.div>

                      <div className="w-full h-22 rounded-t-md bg-gradient-to-t from-[#FF5500] via-amber-500 to-orange-400 shadow-sm shadow-orange-500/30" />
                      <span className="text-[9px] font-semibold text-orange-600 dark:text-orange-400">Wed</span>
                    </div>

                    {/* Thu */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-full h-14 rounded-t-md bg-muted-foreground/25 overflow-hidden flex flex-col justify-end">
                        <div className="w-full h-6 bg-orange-500/40" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">Thu</span>
                    </div>

                    {/* Fri */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-full h-18 rounded-t-md bg-muted-foreground/20 overflow-hidden flex flex-col justify-end">
                        <div className="w-full h-9 bg-orange-500/50" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">Fri</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="mt-7">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-orange-500 transition-colors">
                For hiring managers & recruiters
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Automate technical screening, review STAR interview scorecards, and run accelerated hiring pipelines with zero agency friction.
              </p>
            </div>
          </motion.div>

          {/* CARD 2: For managers & leaders (Reference: Concentric Radar & Stacked Insights Pill) */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="group relative rounded-3xl border border-border/80 bg-card p-7 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
          >
            {/* Visual Container: Concentric Radar with Floating Real-Time Insights Pill */}
            <div className="h-60 sm:h-64 relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-muted/30 to-muted/5 p-4">
              {/* Concentric Radar Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full border border-orange-500/25 dark:border-orange-500/30" />
                <div className="w-44 h-44 rounded-full border border-orange-500/15 dark:border-orange-500/20 absolute" />
                <div className="w-64 h-64 rounded-full border border-orange-500/10 dark:border-orange-500/10 absolute" />
                <div className="w-20 h-20 rounded-full bg-orange-500/10 blur-xl absolute" />
              </div>

              {/* Stacked Floating Deck Effect */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Layer 3 (Bottom): Amber Backing */}
                <div className="h-10 w-44 rounded-xl bg-amber-500/70 border border-amber-500/40 shadow-sm translate-y-3 opacity-60" />

                {/* Layer 2 (Middle): Vibrant Brand Orange Backing */}
                <div className="h-10 w-48 rounded-xl bg-[#FF5500] border border-orange-400 shadow-md translate-y-1.5 opacity-85" />

                {/* Layer 1 (Top Floating Pill): Access Real-Time Insights */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  className="relative z-20 px-4 py-3 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md shadow-xl flex items-center gap-3 min-w-[220px]"
                >
                  <div className="h-8 w-8 rounded-xl bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-foreground tracking-tight">
                      Access Real-Time Insights
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Continuous pipeline sync
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="mt-7">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-orange-500 transition-colors">
                For engineering leaders
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Access real-time candidate scorecards, benchmark ratings, and monitor hiring velocity across all active engineering searches.
              </p>
            </div>
          </motion.div>

          {/* CARD 3: For Talents (Hiring Trends, Interview Prep, Job Search Documentation) */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="group relative rounded-3xl border border-border/80 bg-card p-7 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
          >
            {/* Visual Container: Hiring Trends & Interview Prep Stacked Cards */}
            <div className="h-60 sm:h-64 relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-muted/30 to-muted/5 p-4">
              {/* Ruled / Striped Grid Background */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, currentColor 0, currentColor 1px, transparent 0, transparent 16px)',
                  color: 'var(--border)',
                }}
              />

              {/* Stacked Angled Cards: Hiring Trends & Interview Prep */}
              <div className="relative flex items-center justify-center">
                {/* Left Card (-6 deg tilt): Hiring Trends Preview */}
                <div className="w-30 h-38 rounded-xl border border-border/80 bg-card/95 shadow-sm -rotate-6 -translate-x-5 p-3 space-y-2 pointer-events-none">
                  <div className="flex items-center justify-between pb-1 border-b border-border/60">
                    <span className="text-[9px] font-bold text-foreground">Hiring Trends</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="space-y-1.5 text-[8px] text-muted-foreground">
                    <div className="flex justify-between items-center bg-muted/40 px-1.5 py-0.5 rounded">
                      <span>Moniepoint</span>
                      <span className="text-emerald-500 font-semibold">+12 Roles</span>
                    </div>
                    <div className="flex justify-between items-center bg-muted/40 px-1.5 py-0.5 rounded">
                      <span>Paystack</span>
                      <span className="text-emerald-500 font-semibold">+8 Roles</span>
                    </div>
                    <div className="flex justify-between items-center bg-muted/40 px-1.5 py-0.5 rounded">
                      <span>GitLab Remote</span>
                      <span className="text-orange-500 font-semibold">Live ATS</span>
                    </div>
                  </div>
                </div>

                {/* Right Card (+6 deg tilt): Interview Prep & STAR Rubric Preview */}
                <div className="w-30 h-38 rounded-xl border border-border/80 bg-card/95 shadow-sm rotate-6 translate-x-5 p-3 space-y-2 pointer-events-none">
                  <div className="flex items-center justify-between pb-1 border-b border-border/60">
                    <span className="text-[9px] font-bold text-foreground">AI Prep Coach</span>
                    <Sparkles className="h-2.5 w-2.5 text-orange-500" />
                  </div>
                  <div className="space-y-1.5 text-[8px] text-muted-foreground">
                    <div className="bg-muted/40 p-1.5 rounded">
                      <span className="block font-semibold text-foreground">STAR Rubric</span>
                      <span className="block text-emerald-500">96% Calibrated</span>
                    </div>
                    <div className="bg-muted/40 p-1.5 rounded">
                      <span className="block font-semibold text-foreground">SyncFlow Tracker</span>
                      <span className="block text-muted-foreground">Documented in 1 place</span>
                    </div>
                  </div>
                </div>

                {/* Centered Glowing Squircle Badge with Talent Empowerment Icon */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute z-20 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5500] via-amber-500 to-orange-600 shadow-xl shadow-orange-500/30 flex items-center justify-center text-white border border-white/20">
                    <Sparkles className="h-8 w-8 text-white drop-shadow-sm" />
                  </div>
                  {/* Subtle Radiance */}
                  <div className="absolute w-20 h-20 rounded-full bg-orange-500/25 blur-xl pointer-events-none" />
                </motion.div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="mt-7">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-orange-500 transition-colors">
                For talents
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Follow trends on who is hiring, prepare for interviews with AI coaching, and document your job search all in one place.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* PART 2: Supporting Part Bento Row (Inspired by Reference Image 1)         */}
        {/* Asymmetrical 2-Card Layout: Wide Marketplace Card + Orbital Outreach      */}
        {/* ========================================================================= */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CARD 4: Wide Card (~60% width - Reference: Talent Marketplace Database) */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-7 sm:p-9 flex flex-col justify-between overflow-hidden shadow-sm hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
          >
            <div>
              {/* Top-Left Document / Data Squircle Badge */}
              <div className="h-11 w-11 rounded-2xl border border-orange-500/25 bg-orange-500/10 flex items-center justify-center text-[#FF5500] shadow-sm mb-6">
                <FileText className="h-5 w-5" />
              </div>

              {/* Central Floating Mockup Area: Talent Marketplace List + Vetting Velocity Chart */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Sub-widget: Floating Candidates / Vetted Talents List (Left) */}
                <div className="sm:col-span-7 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md p-4 sm:p-5 shadow-lg">
                  {/* Window Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <span className="text-sm font-bold text-foreground tracking-tight">Talent Marketplace</span>
                    <Link
                      href="/find-work"
                      className="text-xs font-semibold text-muted-foreground hover:text-orange-500 transition-colors"
                    >
                      See all
                    </Link>
                  </div>

                  {/* Filter Pills (Interactive talent domains) */}
                  <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setActiveTab('engineering')}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                        activeTab === 'engineering'
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Engineering <span className="opacity-80">24</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('aiml')}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                        activeTab === 'aiml'
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      AI & Data <span className="opacity-80">12</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('product')}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                        activeTab === 'product'
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Product <span className="opacity-80">8</span>
                    </button>
                  </div>

                  {/* Candidate Rows (African Technical Talents with Direct Chat Outreach) */}
                  <div className="mt-3.5 space-y-2.5">
                    <AnimatePresence mode="wait">
                      {candidates.map((talent, idx) => (
                        <motion.div
                          key={talent.name}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18, delay: idx * 0.04 }}
                          className="flex items-center justify-between p-1.5 rounded-xl hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border/70 shrink-0">
                              <Image
                                src={talent.avatar}
                                alt={talent.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{talent.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{talent.role}</p>
                            </div>
                          </div>

                          <div
                            title="Direct Real-Time Chat"
                            className="h-7 w-7 rounded-lg border border-border/70 bg-card hover:border-orange-500/40 hover:text-orange-500 flex items-center justify-center text-muted-foreground transition-colors shrink-0 cursor-pointer"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Sub-widget: Vetting Velocity / Match Metric (Right) */}
                <div className="sm:col-span-5 rounded-2xl border border-border/80 bg-background/70 p-4 shadow-sm hidden sm:flex flex-col justify-between h-full min-h-[220px]">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
                    <span className="font-semibold text-foreground text-[11px]">Vetting Velocity</span>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <span className="cursor-pointer hover:text-foreground">Daily</span>
                      <span className="cursor-pointer hover:text-foreground">Weekly</span>
                      <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">Monthly</span>
                    </div>
                  </div>

                  {/* Highlight Bar with 96% Match Pill */}
                  <div className="relative flex items-end justify-center gap-2 pt-8 pb-2 h-36">
                    {/* Background muted bars */}
                    <div className="w-5 h-14 rounded-t-md bg-muted/60" />
                    <div className="w-5 h-20 rounded-t-md bg-muted/70" />

                    {/* Dominant Highlight Bar with Match Badge */}
                    <div className="relative flex flex-col items-center">
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        className="absolute -top-6 z-10"
                      >
                        <span className="bg-zinc-950 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                          96% Fit
                        </span>
                      </motion.div>

                      <div className="w-7 h-28 rounded-t-lg bg-gradient-to-t from-[#FF5500] via-amber-500 to-orange-400 shadow-md shadow-orange-500/20" />
                    </div>

                    <div className="w-5 h-16 rounded-t-md bg-muted/70" />
                    <div className="w-5 h-22 rounded-t-md bg-muted/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="mt-8">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:text-orange-500 transition-colors">
                All candidate intelligence at once
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Explore our talent marketplace with verified GitHub code audits, interview scores, and real-time availability. Hiring teams reach out in real time directly from the talent dashboard.
              </p>
            </div>
          </motion.div>

          {/* CARD 5: Compact Card (~40% width - Real-time Recruiter Outreach with Circular Orbit) */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-7 sm:p-9 flex flex-col justify-between overflow-hidden shadow-sm hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
          >
            {/* Visual Container: Circular Avatar Wheel with Center Collaboration Icon */}
            <div className="h-64 sm:h-72 relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-muted/30 to-muted/5 p-4">
              {/* Elevated Center Medallion (Stylized Partnership / Collaboration Glyph) */}
              <div className="relative z-20 w-16 h-16 rounded-full bg-background border-2 border-border/80 shadow-lg flex items-center justify-center">
                <Users2 className="h-7 w-7 text-zinc-900 dark:text-zinc-100" />
              </div>

              {/* Orbital Talent Wheel Container (Continuously orbits around center) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                {ORBIT_TALENTS.map((talent, i) => {
                  const angle = (i * 360) / ORBIT_TALENTS.length;
                  const radian = (angle * Math.PI) / 180;
                  // Radius = 82px
                  const radius = 82;
                  const x = Math.round(Math.cos(radian) * radius);
                  const y = Math.round(Math.sin(radian) * radius);

                  return (
                    <div
                      key={talent.id}
                      className="absolute"
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    >
                      {/* Counter-rotate each avatar so photos stay perfectly upright while orbiting */}
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
                        className="relative h-10 w-10 rounded-xl overflow-hidden border-2 border-background shadow-md bg-card"
                      >
                        <Image
                          src={talent.avatar}
                          alt={talent.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Ambient radial radiance */}
              <div className="absolute w-44 h-44 rounded-full bg-orange-500/5 blur-2xl pointer-events-none" />
            </div>

            {/* Bottom Content */}
            <div className="mt-8">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:text-orange-500 transition-colors">
                Real-time recruiter outreach
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Reach out to top 2% African technical talents in real time from your talent dashboard, compressing recruitment timelines from months down to days.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
