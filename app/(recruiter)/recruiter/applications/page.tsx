import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const applications = [
  { name: 'Jane Doe', role: 'Senior Frontend Engineer', date: 'Nov 8, 2026', status: 'new', initials: 'JD' },
  { name: 'John Smith', role: 'Full Stack Developer', date: 'Nov 7, 2026', status: 'reviewing', initials: 'JS' },
  { name: 'Alice Brown', role: 'Product Designer', date: 'Nov 6, 2026', status: 'interview', initials: 'AB' },
  { name: 'Bob Wilson', role: 'DevOps Engineer', date: 'Nov 4, 2026', status: 'offer', initials: 'BW' },
  { name: 'Carol Lee', role: 'Full Stack Developer', date: 'Nov 2, 2026', status: 'rejected', initials: 'CL' },
];

const statusStyles: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  reviewing: 'bg-warning/10 text-warning border-warning/20',
  interview: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  offer: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function RecruiterApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="mt-1 text-muted-foreground">Review and manage applications across all jobs.</p>
      </div>
      <div className="space-y-3">
        {applications.map((app) => (
          <Card key={app.name} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {app.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <h3 className="font-semibold">{app.name}</h3>
                  <p className="text-sm text-muted-foreground">{app.role} · Applied {app.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={statusStyles[app.status]}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </Badge>
                <Button size="sm" variant="outline">Review</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
