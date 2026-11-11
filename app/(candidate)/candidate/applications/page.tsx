'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Compass, FileCheck2 } from 'lucide-react';

const applications = [
  { title: 'Senior Frontend Engineer', company: 'TechCorp', date: 'Nov 8, 2026', status: 'reviewing' },
  { title: 'Product Designer', company: 'DesignHub', date: 'Nov 5, 2026', status: 'pending' },
  { title: 'Full Stack Developer', company: 'StartupXYZ', date: 'Nov 2, 2026', status: 'accepted' },
  { title: 'DevOps Engineer', company: 'CloudSys', date: 'Oct 28, 2026', status: 'rejected' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
};

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            My Applications
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Track the real-time status of all your submitted roles.
          </p>
        </div>
        <Link href="/dashboard/crawler">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium">
            <Compass className="h-3.5 w-3.5 stroke-[1.5]" /> Browse Openings
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {applications.map((app) => (
          <Card
            key={app.title}
            className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
          >
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileCheck2 className="h-3.5 w-3.5 stroke-[1.5]" />
                  </span>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    {app.title}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium pl-9">
                  <span>{app.company}</span>
                  <span className="mx-1.5">·</span>
                  <span>Applied {app.date}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusStyles[app.status]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                  {app.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium inline-flex items-center gap-1"
                >
                  View <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
