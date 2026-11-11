'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Bookmark, ArrowUpRight, Globe2, Sparkles } from 'lucide-react';
import { ResumeGeneratorModal, TargetJobContext } from '@/components/resume/resume-generator-modal';
import { createBrowserClient } from '@/lib/supabase/client';

interface JobItem {
  id?: string;
  title: string;
  company: string;
  location: string;
  job_type?: string;
  type?: string;
  salary_range?: string | null;
  salary?: string;
  tags?: string[];
}

const defaultJobs: JobItem[] = [
  { title: 'Senior Frontend Engineer', company: 'TechCorp', location: 'Remote', type: 'Full-time', salary: '$120k–$150k', tags: ['React', 'TypeScript', 'Next.js'] },
  { title: 'Product Designer', company: 'DesignHub', location: 'New York, NY', type: 'Full-time', salary: '$90k–$110k', tags: ['Figma', 'UX', 'UI'] },
  { title: 'Full Stack Developer', company: 'StartupXYZ', location: 'San Francisco, CA', type: 'Contract', salary: '$80–$100/hr', tags: ['Node', 'React', 'Postgres'] },
  { title: 'DevOps Engineer', company: 'CloudSys', location: 'Remote', type: 'Full-time', salary: '$130k–$160k', tags: ['AWS', 'Docker', 'Kubernetes'] },
  { title: 'Data Scientist', company: 'DataFlow', location: 'Boston, MA', type: 'Full-time', salary: '$110k–$140k', tags: ['Python', 'ML', 'SQL'] },
  { title: 'Mobile Developer', company: 'AppWorks', location: 'Remote', type: 'Part-time', salary: '$60–$80/hr', tags: ['React Native', 'iOS', 'Android'] },
];

export default function BrowseJobsPage() {
  const [jobsList, setJobsList] = useState<JobItem[]>(defaultJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedResumeJob, setSelectedResumeJob] = useState<TargetJobContext | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: JobItem[] = data.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location,
            type: j.job_type,
            salary: j.salary_range || 'Competitive',
            tags: [j.job_type || 'Full-time'],
          }));
          setJobsList(mapped);
        }
      } catch {
        // Fall back to default showcase jobs
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  const filteredJobs = jobsList.filter((j) => {
    const q = searchTerm.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Browse Jobs
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Discover opportunities matched to your verified profile.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
        <Input
          placeholder="Search by title, company, or tech stack..."
          className="pl-9 h-10 rounded-lg border-neutral-200 dark:border-neutral-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400 stroke-[1.5]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job, idx) => (
            <Card
              key={job.id || job.title + idx}
              className="flex flex-col justify-between rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all p-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 leading-snug">
                      {job.title}
                    </h3>
                    <p className="text-xs uppercase font-semibold tracking-wider text-neutral-500 mt-0.5">
                      {job.company}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[11px] font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    {job.type}
                  </Badge>
                </div>

                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
                    <span>{job.location}</span>
                    <span className="mx-1">·</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{job.salary}</span>
                  </p>
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {job.tags.map((tag) => (
                        <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-normal">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button size="sm" className="flex-1 text-xs h-9 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 rounded-lg inline-flex items-center justify-center gap-1">
                  Apply <ArrowUpRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-9 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium inline-flex items-center gap-1">
                  <Bookmark className="h-3.5 w-3.5 stroke-[1.5]" /> Save
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
