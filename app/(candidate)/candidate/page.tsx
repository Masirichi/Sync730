import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, Heart, TrendingUp, ArrowRight } from 'lucide-react';

const stats = [
  { label: 'Active Applications', value: '7', icon: FileText, color: 'text-primary' },
  { label: 'Saved Jobs', value: '12', icon: Heart, color: 'text-destructive' },
  { label: 'Profile Views', value: '34', icon: TrendingUp, color: 'text-success' },
  { label: 'New Matches', value: '5', icon: Briefcase, color: 'text-warning' },
];

const recommendedJobs = [
  { title: 'Senior Frontend Engineer', company: 'TechCorp', location: 'Remote', type: 'Full-time', salary: '$120k–$150k', match: 95 },
  { title: 'Product Designer', company: 'DesignHub', location: 'New York, NY', type: 'Full-time', salary: '$90k–$110k', match: 88 },
  { title: 'Full Stack Developer', company: 'StartupXYZ', location: 'San Francisco, CA', type: 'Contract', salary: '$80–$100/hr', match: 82 },
];

export default function CandidateDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, Jane</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening with your job search.</p>
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
          <h2 className="text-xl font-semibold">Recommended for you</h2>
          <Button variant="ghost" size="sm" asChild>
            <a href="/candidate/jobs">View all <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {recommendedJobs.map((job) => (
            <Card key={job.title} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{job.title}</h3>
                    <Badge variant="secondary">{job.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.company} · {job.location} · {job.salary}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-success">{job.match}% match</p>
                  </div>
                  <Button size="sm">Apply</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
