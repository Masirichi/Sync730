'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, DollarSign, Loader2 } from 'lucide-react';
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
      } catch (e) {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Jobs</h1>
        <p className="mt-1 text-muted-foreground">Discover opportunities matched to your profile.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title, company, or skill..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job, idx) => (
            <Card key={job.id || job.title + idx} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
                  </div>
                  <Badge variant="secondary">{job.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location}</p>
                  <p className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> {job.salary}</p>
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">Apply</Button>
                  <Button size="sm" variant="outline">Save</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
