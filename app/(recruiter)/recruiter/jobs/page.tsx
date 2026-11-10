import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

const jobs = [
  { title: 'Senior Frontend Engineer', status: 'open', applicants: 34, date: 'Nov 1, 2026' },
  { title: 'Product Designer', status: 'open', applicants: 18, date: 'Oct 28, 2026' },
  { title: 'Full Stack Developer', status: 'draft', applicants: 0, date: 'Nov 9, 2026' },
  { title: 'DevOps Engineer', status: 'closed', applicants: 52, date: 'Sep 15, 2026' },
];

const statusStyles: Record<string, string> = {
  open: 'bg-success/10 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  closed: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function RecruiterJobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="mt-1 text-muted-foreground">Manage your job listings.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Post a Job
        </Button>
      </div>
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.title} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{job.title}</h3>
                  <Badge variant="outline" className={statusStyles[job.status]}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {job.applicants} applicants · Posted {job.date}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm">View applicants</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
