'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowUpRight, Compass } from 'lucide-react';

const savedJobs = [
  { title: 'Senior Frontend Engineer', company: 'TechCorp', location: 'Remote', salary: '$120k–$150k', type: 'Full-time' },
  { title: 'DevOps Engineer', company: 'CloudSys', location: 'Remote', salary: '$130k–$160k', type: 'Full-time' },
];

export default function SavedJobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Saved Jobs
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Roles you have bookmarked to review and apply to later.
          </p>
        </div>
        <Link href="/dashboard/crawler">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium">
            <Compass className="h-3.5 w-3.5 stroke-[1.5]" /> Browse Remote Feed
          </Button>
        </Link>
      </div>

      {savedJobs.length > 0 ? (
        <div className="space-y-3">
          {savedJobs.map((job) => (
            <Card
              key={job.title}
              className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
            >
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Bookmark className="h-3.5 w-3.5 stroke-[1.5] fill-current" />
                    </span>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      {job.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800">
                      {job.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    <span>{job.company}</span>
                    <span className="mx-1.5">·</span>
                    <span>{job.location}</span>
                    <span className="mx-1.5">·</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{job.salary}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" className="text-xs h-9 px-4 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 font-semibold inline-flex items-center gap-1">
                    Apply now <ArrowUpRight className="h-3.5 w-3.5 stroke-[1.5]" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bookmark className="h-10 w-10 text-neutral-300 dark:text-neutral-700 stroke-[1.25]" />
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              No saved jobs yet. Explore the Remote Feed to bookmark roles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
