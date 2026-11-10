import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const applications = [
  { title: 'Senior Frontend Engineer', company: 'TechCorp', date: 'Nov 8, 2026', status: 'reviewing' },
  { title: 'Product Designer', company: 'DesignHub', date: 'Nov 5, 2026', status: 'pending' },
  { title: 'Full Stack Developer', company: 'StartupXYZ', date: 'Nov 2, 2026', status: 'accepted' },
  { title: 'DevOps Engineer', company: 'CloudSys', date: 'Oct 28, 2026', status: 'rejected' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  reviewing: 'bg-primary/10 text-primary border-primary/20',
  accepted: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <p className="mt-1 text-muted-foreground">Track the status of all your job applications.</p>
      </div>
      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.title} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <h3 className="font-semibold">{app.title}</h3>
                <p className="text-sm text-muted-foreground">{app.company} · Applied {app.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={statusStyles[app.status]}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </Badge>
                <Button size="sm" variant="outline">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
