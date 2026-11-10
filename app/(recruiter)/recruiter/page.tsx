import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, FileText, TrendingUp, Plus, ArrowRight } from 'lucide-react';

const stats = [
  { label: 'Open Jobs', value: '4', icon: Briefcase, color: 'text-primary' },
  { label: 'Total Candidates', value: '128', icon: Users, color: 'text-success' },
  { label: 'New Applications', value: '23', icon: FileText, color: 'text-warning' },
  { label: 'Hires This Month', value: '3', icon: TrendingUp, color: 'text-destructive' },
];

const recentApplications = [
  { name: 'Jane Doe', role: 'Senior Frontend Engineer', date: '2h ago', status: 'new' },
  { name: 'John Smith', role: 'Full Stack Developer', date: '5h ago', status: 'reviewing' },
  { name: 'Alice Brown', role: 'Product Designer', date: '1d ago', status: 'interview' },
  { name: 'Bob Wilson', role: 'DevOps Engineer', date: '2d ago', status: 'offer' },
];

const statusStyles: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  reviewing: 'bg-warning/10 text-warning border-warning/20',
  interview: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  offer: 'bg-success/10 text-success border-success/20',
};

export default function RecruiterDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recruiter Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your jobs, candidates, and hiring pipeline.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Post a Job
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <span className="text-3xl font-bold">{stat.value}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Applications</h2>
          <Button variant="ghost" size="sm" asChild>
            <a href="/recruiter/applications">View all <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {recentApplications.map((app) => (
            <Card key={app.name} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <h3 className="font-semibold">{app.name}</h3>
                  <p className="text-sm text-muted-foreground">{app.role} · {app.date}</p>
                </div>
                <Badge variant="outline" className={statusStyles[app.status]}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
