import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

const jobs = [
  { title: 'Senior Frontend Engineer', company: 'TechCorp', status: 'open', applicants: 34 },
  { title: 'Product Designer', company: 'DesignHub', status: 'open', applicants: 18 },
  { title: 'Full Stack Developer', company: 'StartupXYZ', status: 'open', applicants: 56 },
  { title: 'DevOps Engineer', company: 'CloudSys', status: 'flagged', applicants: 52 },
  { title: 'Data Scientist', company: 'DataFlow', status: 'open', applicants: 41 },
];

const statusStyles: Record<string, string> = {
  open: 'bg-success/10 text-success border-success/20',
  flagged: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <p className="mt-1 text-muted-foreground">Monitor and moderate all job listings.</p>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.title}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{job.title}</h3>
                  <Badge variant="outline" className={statusStyles[job.status]}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  {job.company} · <Users className="h-3.5 w-3.5" /> {job.applicants} applicants
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View</Button>
                <Button size="sm" variant="outline">Moderate</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
