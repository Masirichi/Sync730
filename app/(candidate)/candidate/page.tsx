'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Briefcase,
  FileText,
  Heart,
  TrendingUp,
  ArrowRight,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';

// Exact original stats from the current candidate dashboard
const stats = [
  {
    label: 'Active Applications',
    value: '7',
    icon: FileText,
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    trend: '+12.08%',
    trendType: 'positive',
  },
  {
    label: 'Saved Jobs',
    value: '12',
    icon: Heart,
    iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    trend: '+4 new',
    trendType: 'positive',
  },
  {
    label: 'Profile Views',
    value: '34',
    icon: TrendingUp,
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    trend: '+18.5%',
    trendType: 'positive',
  },
  {
    label: 'New Matches',
    value: '5',
    icon: Briefcase,
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    trend: 'Today',
    trendType: 'neutral',
  },
];

// Exact original recommended jobs from the current candidate dashboard
const recommendedJobs = [
  {
    title: 'Senior Frontend Engineer',
    company: 'TechCorp',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120k–$150k',
    match: 95,
    dueNotice: 'Fri, 10 Oct',
    statusBadge: 'FastTrack',
    statusVariant: 'emerald',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    title: 'Product Designer',
    company: 'DesignHub',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$90k–$110k',
    match: 88,
    dueNotice: 'Sun, 12 Oct',
    statusBadge: '2 Days Left',
    statusVariant: 'blue',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  },
  {
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'San Francisco, CA',
    type: 'Contract',
    salary: '$80–$100/hr',
    match: 82,
    dueNotice: 'Mon, 13 Oct',
    statusBadge: '6 Days Left',
    statusVariant: 'amber',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  },
];

// Applications data mapped to the inspiration table logic
const recentApplications = [
  {
    company: 'TechCorp',
    role: 'Senior Frontend Engineer',
    location: 'Remote (Worldwide)',
    salary: '$120,000 - $150,000 USD',
    appliedDate: 'Nov 8, 2026',
    status: 'Reviewing',
    statusColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  },
  {
    company: 'DesignHub',
    role: 'Product Designer',
    location: 'New York, NY (Hybrid)',
    salary: '$90,000 - $110,000 USD',
    appliedDate: 'Nov 5, 2026',
    status: 'Pending',
    statusColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  {
    company: 'StartupXYZ',
    role: 'Full Stack Developer',
    location: 'San Francisco, CA',
    salary: '$80 - $100 / hr',
    appliedDate: 'Nov 2, 2026',
    status: 'Accepted',
    statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    company: 'CloudSys',
    role: 'DevOps Engineer',
    location: 'Remote (EMEA)',
    salary: '$130,000 - $160,000 USD',
    appliedDate: 'Oct 28, 2026',
    status: 'Rejected',
    statusColor: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  },
];

// Recruiter contacts matching the Cody Fisher / Robert Fox cards in the inspiration
const recruiterContacts = [
  {
    name: 'Sarah Jenkins',
    company: 'TechCorp Talent Lead',
    initials: 'SJ',
    action: 'Open Chat →',
    href: '/candidate/messages',
  },
  {
    name: 'David O\'Connor',
    company: 'DesignHub VP Product',
    initials: 'DO',
    action: 'Open Chat →',
    href: '/candidate/messages',
  },
];

export default function CandidateDashboard() {
  const [searchTableQuery, setSearchTableQuery] = useState('');

  const filteredApplications = recentApplications.filter(
    (app) =>
      app.role.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTableQuery.toLowerCase())
  );

  return (
    <div className="space-y-7">
      {/* Welcome Banner (Retaining existing greeting & subtitle) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome back, Jane
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Here&apos;s what&apos;s happening with your job search.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/crawler">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3.5 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium"
            >
              Browse Remote Feed
            </Button>
          </Link>
          <Link href="/dashboard/tracker">
            <Button
              size="sm"
              className="text-xs h-9 px-4 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 font-semibold"
            >
              Open Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards Row (Borrowing exact inspiration design logic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {stat.label}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stat.value}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                  stat.trendType === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                }`}
              >
                {stat.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Two-Column Section (Inspiration Rhythm) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Wide Column (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Recommended for you (Borrowing "Things to do (6)" design logic) */}
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Recommended for you ({recommendedJobs.length})
                </h2>
              </div>
              <Link
                href="/candidate/jobs"
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3 pt-4">
              {recommendedJobs.map((job) => (
                <div
                  key={job.title}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors gap-3"
                >
                  {/* Left: Square Icon + Title & Subtitle */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${job.iconBg}`}
                    >
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {job.title}
                        </h3>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {job.type}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {job.company} · {job.location} · {job.salary}
                      </p>
                    </div>
                  </div>

                  {/* Right: Date notice, Match pill, Apply CTA */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-neutral-400 hidden md:inline">
                      {job.dueNotice}
                    </span>

                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                      {job.match}% match
                    </span>

                    <Button
                      size="sm"
                      className="text-xs h-8 px-3 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 font-semibold"
                    >
                      Apply
                    </Button>

                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                      title="Options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 2: Recent Applications (Borrowing "Recent Payroll" data table design logic) */}
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Recent Applications
              </h2>
              <Link
                href="/candidate/applications"
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Table Search & Filters bar */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchTableQuery}
                  onChange={(e) => setSearchTableQuery(e.target.value)}
                  className="pl-8 text-xs h-8 border-neutral-200 dark:border-neutral-800 rounded-lg"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 px-3 rounded-lg border-neutral-200 dark:border-neutral-800"
              >
                <SlidersHorizontal className="h-3 w-3" /> Filters
              </Button>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-medium">
                    <th className="pb-3 font-semibold">Role & Company ⇅</th>
                    <th className="pb-3 font-semibold">Location ⇅</th>
                    <th className="pb-3 font-semibold">Applied Date ⇅</th>
                    <th className="pb-3 font-semibold">Compensation ⇅</th>
                    <th className="pb-3 font-semibold">Status ⇅</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.company + app.role}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3.5 pr-3">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {app.role}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {app.company}
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 text-neutral-600 dark:text-neutral-400">
                        {app.location}
                      </td>
                      <td className="py-3.5 pr-3 text-neutral-500">
                        {app.appliedDate}
                      </td>
                      <td className="py-3.5 pr-3 font-medium text-neutral-800 dark:text-neutral-200">
                        {app.salary}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${app.statusColor}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href="/candidate/applications"
                          className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right / Narrow Column (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: FastTrack Vetting Status (Borrowing "Previous Payroll" card logic) */}
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> FastTrack Vetting
              </span>
              <span>Nov 2026</span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                Pre-Vetted
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300">
                Verified
              </span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pt-1">
              Your assessment is active. 32 verified remote hiring teams have unlocked direct contact routing.
            </p>
          </Card>

          {/* Card 2: Upcoming Interviews & Recruiter Activity (Borrowing "Upcoming Payroll" Cody Fisher / Robert Fox cards) */}
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-600" /> Upcoming Interviews
              </span>
              <span>Nov 14, 2026</span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                2 Scheduled
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300">
                Pending
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {recruiterContacts.map((contact) => (
                <div
                  key={contact.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/30 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold">
                        {contact.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {contact.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {contact.company}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={contact.href}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 hover:underline shrink-0"
                  >
                    {contact.action}
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 3: Profile Match Rate & Skills Breakdown (Borrowing "Total Employee 3,200" barcode card logic) */}
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 text-[11px]">
                Profile Match Rate
              </span>
              <Link
                href="/candidate"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Big 94% Metric + Pill */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  94%
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300">
                  +6%
                </span>
              </div>
            </div>

            {/* Segmented Barcode Progress Bar (Inspiration Style) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-neutral-500">
                <span>15%</span>
                <span>63%</span>
                <span>22%</span>
              </div>
              <div className="flex h-6 w-full items-center gap-1 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800 p-1">
                {/* Segment 1: Amber stripes */}
                <div
                  className="h-full bg-amber-400 rounded-sm"
                  style={{ width: '15%' }}
                  title="Design & Product (15%)"
                />
                {/* Segment 2: Blue stripes */}
                <div
                  className="h-full bg-blue-600 rounded-sm"
                  style={{ width: '63%' }}
                  title="Full Stack & TypeScript (63%)"
                />
                {/* Segment 3: Emerald stripes */}
                <div
                  className="h-full bg-emerald-500 rounded-sm"
                  style={{ width: '22%' }}
                  title="Cloud & DevOps (22%)"
                />
              </div>
            </div>

            {/* Legend list matching the inspiration */}
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-400 shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Product & System Design
                  </span>
                </div>
                <span className="text-neutral-500 font-medium inline-flex items-center gap-1">
                  15% <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-600 shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Full Stack & TypeScript
                  </span>
                </div>
                <span className="text-neutral-500 font-medium inline-flex items-center gap-1">
                  63% <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Cloud & Infrastructure
                  </span>
                </div>
                <span className="text-neutral-500 font-medium inline-flex items-center gap-1">
                  22% <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
