'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FileCheck2,
  Bookmark,
  TrendingUp,
  Target,
  Code2,
  Palette,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  ChevronsUpDown,
  Bell,
  Settings,
} from 'lucide-react';

// Exact original stats with premium icons and stroke-width
const stats = [
  {
    label: 'Active Applications',
    value: '7',
    icon: FileCheck2,
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/40',
    trend: '+12.08%',
    trendType: 'positive',
  },
  {
    label: 'Profile Views',
    value: '34',
    icon: TrendingUp,
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/40',
    trend: '+18.5%',
    trendType: 'positive',
  },
  {
    label: 'Saved Jobs',
    value: '12',
    icon: Bookmark,
    iconBg: 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-900/40',
    trend: '+4 new',
    trendType: 'positive',
  },
];

// Exact original recommended jobs with tailored role icons
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
    statusBadgeColor: 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
    icon: Code2,
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    title: 'Product Designer',
    company: 'DesignHub',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$90k–$110k',
    match: 88,
    dueNotice: 'Sun, 12 Oct',
    statusBadge: '2 Day Left',
    statusBadgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
    icon: Palette,
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-400',
  },
  {
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'San Francisco, CA',
    type: 'Contract',
    salary: '$80–$100/hr',
    match: 82,
    dueNotice: 'Mon, 13 Oct',
    statusBadge: '6 Day Left',
    statusBadgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
    icon: Layers,
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400',
  },
];

// Applications data mapped to table logic
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

// Recruiter contacts matching the inspiration
const recruiterContacts = [
  {
    name: 'Sarah Jenkins',
    company: 'TechCorp Talent Lead',
    initials: 'SJ',
    action: 'Open Chat',
    href: '/candidate/messages',
  },
  {
    name: 'David O\'Connor',
    company: 'DesignHub VP Product',
    initials: 'DO',
    action: 'Open Chat',
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
    <div className="space-y-6">
      {/* Top Header Row (Matching HireHR's Dashboard Overview header bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            Dashboard Overview
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Welcome back, Jane · Pre-vetted African remote talent ecosystem
          </p>
        </div>

        {/* Right utility buttons & user card (Inspiration style) */}
        <div className="flex items-center gap-3">
          {/* Notification Button with red 3 badge */}
          <button
            type="button"
            className="relative h-10 w-10 rounded-full border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4 stroke-[1.5]" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
              3
            </span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            className="h-10 w-10 rounded-full border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4 stroke-[1.5]" />
          </button>

          {/* User Profile Card (Daniel Cohen / New York USA style) */}
          <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-800 shadow-sm">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                Jane Doe
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight">
                Lagos, Nigeria
              </span>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="hidden xl:flex items-center gap-2 pl-2">
            <Link href="/dashboard/crawler">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium"
              >
                Remote Feed
              </Button>
            </Link>
            <Link href="/dashboard/tracker">
              <Button
                size="sm"
                className="text-xs h-9 px-3.5 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 font-semibold"
              >
                Tracker
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 1: Top 4 Stat Cards Row (Borrowing exact HireHR 4-card top row logic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total employee equivalent -> Active Applications */}
        {stats.slice(0, 1).map((stat) => (
          <Card
            key={stat.label}
            className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                <stat.icon className="h-5 w-5 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {stat.label}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3 stroke-[1.75]" /> {stat.trend}
              </span>
            </div>
          </Card>
        ))}

        {/* Card 2: Attendance rate equivalent -> Profile Views */}
        {stats.slice(1, 2).map((stat) => (
          <Card
            key={stat.label}
            className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                <stat.icon className="h-5 w-5 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {stat.label}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3 stroke-[1.75]" /> {stat.trend}
              </span>
            </div>
          </Card>
        ))}

        {/* Card 3: Total Revenue equivalent -> Saved Jobs */}
        {stats.slice(2, 3).map((stat) => (
          <Card
            key={stat.label}
            className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                <stat.icon className="h-5 w-5 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {stat.label}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 inline-flex items-center gap-1">
                <Bookmark className="h-3 w-3 stroke-[1.75]" /> {stat.trend}
              </span>
            </div>
          </Card>
        ))}

        {/* Card 4: Previous Payroll equivalent -> FastTrack Vetting */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 stroke-[1.5] text-purple-600 dark:text-purple-400" /> FastTrack Vetting
            </span>
            <span className="text-neutral-400 text-[11px]">Nov 2026</span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
              Pre-Vetted
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
              Verified
            </span>
          </div>

          <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
            32 verified remote hiring teams active
          </p>
        </Card>
      </div>

      {/* Row 2: Middle Section (Things to do on Left, Upcoming Payroll on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Things to do (6) equivalent -> Recommended for you */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Recommended for you ({recommendedJobs.length})
              </h2>
              <Link
                href="/candidate/jobs"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3 stroke-[1.5]" />
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
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${job.iconBg}`}
                    >
                      <job.icon className="h-5 w-5 stroke-[1.5]" />
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

                  {/* Right: Date notice, Status pill, Match pill, Apply CTA */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-neutral-400 hidden md:inline">
                      {job.dueNotice}
                    </span>

                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${job.statusBadgeColor}`}>
                      {job.statusBadge}
                    </span>

                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                      {job.match}% match
                    </span>

                    <Button
                      size="sm"
                      className="text-xs h-7 px-3 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 font-semibold"
                    >
                      Apply
                    </Button>

                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                      title="Options"
                    >
                      <MoreHorizontal className="h-4 w-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): Upcoming Payroll equivalent -> Upcoming Interviews */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 stroke-[1.5] text-purple-600 dark:text-purple-400" /> Upcoming Interviews
              </span>
              <span className="text-neutral-400 text-[11px]">Nov 14, 2026</span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                2 Scheduled
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300">
                Pending
              </span>
            </div>

            <div className="space-y-3 pt-1">
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
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 hover:underline shrink-0 inline-flex items-center gap-0.5"
                  >
                    {contact.action} <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3: Bottom Section (Recent Payroll Table on Left, Total Employee on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Recent Payroll equivalent -> Recent Applications */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Recent Applications
              </h2>
              <Link
                href="/candidate/applications"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3 stroke-[1.5]" />
              </Link>
            </div>

            {/* Table Search & Filters bar (Inspiration Style) */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
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
                className="gap-1.5 text-xs h-8 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium"
              >
                <SlidersHorizontal className="h-3 w-3 stroke-[1.5]" /> Filters
              </Button>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-medium">
                    <th className="pb-3 font-semibold">
                      Role & Company <ChevronsUpDown className="h-3 w-3 stroke-[1.5] inline opacity-50" />
                    </th>
                    <th className="pb-3 font-semibold">
                      Location <ChevronsUpDown className="h-3 w-3 stroke-[1.5] inline opacity-50" />
                    </th>
                    <th className="pb-3 font-semibold">
                      Applied Date <ChevronsUpDown className="h-3 w-3 stroke-[1.5] inline opacity-50" />
                    </th>
                    <th className="pb-3 font-semibold">
                      Compensation <ChevronsUpDown className="h-3 w-3 stroke-[1.5] inline opacity-50" />
                    </th>
                    <th className="pb-3 font-semibold">
                      Status <ChevronsUpDown className="h-3 w-3 stroke-[1.5] inline opacity-50" />
                    </th>
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
                          className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline inline-flex items-center gap-0.5"
                        >
                          View <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): Total Employee 3,200 equivalent -> Profile Match Rate */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 text-[11px]">
                Profile Match Rate
              </span>
              <Link
                href="/candidate"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3 stroke-[1.5]" />
              </Link>
            </div>

            {/* Big 94% Metric + Pill */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/50 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 stroke-[1.5]" />
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

            {/* Segmented Barcode Soundwave Chart (Recreating HireHR's signature barcode pattern) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-neutral-500">
                <span>15%</span>
                <span>63%</span>
                <span>22%</span>
              </div>
              <div className="flex h-10 w-full items-center justify-between gap-[2px] overflow-hidden py-1">
                {/* Amber stripes (15%) */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`amber-${i}`} className="h-full w-[3px] rounded-full bg-amber-400 shrink-0" />
                ))}
                {/* Blue stripes (63%) */}
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={`blue-${i}`} className="h-full w-[3px] rounded-full bg-blue-600 shrink-0" />
                ))}
                {/* Green stripes (22%) */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={`green-${i}`} className="h-full w-[3px] rounded-full bg-emerald-500 shrink-0" />
                ))}
              </div>
            </div>

            {/* Legend list matching HireHR */}
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-400 shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Product & System Design
                  </span>
                </div>
                <span className="text-neutral-500 font-medium inline-flex items-center gap-1">
                  15% <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
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
                  63% <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
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
                  22% <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
