import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Briefcase, Clock } from 'lucide-react';

const metrics = [
  { label: 'Total Applications', value: '156', change: '+12%', icon: Users, color: 'text-primary' },
  { label: 'Active Jobs', value: '4', change: '+1', icon: Briefcase, color: 'text-success' },
  { label: 'Avg. Time to Hire', value: '18 days', change: '-3 days', icon: Clock, color: 'text-warning' },
  { label: 'Hire Rate', value: '24%', change: '+5%', icon: TrendingUp, color: 'text-destructive' },
];

const funnel = [
  { stage: 'Applied', count: 156, width: '100%' },
  { stage: 'Reviewing', count: 64, width: '41%' },
  { stage: 'Interview', count: 22, width: '14%' },
  { stage: 'Offer', count: 8, width: '5%' },
  { stage: 'Hired', count: 5, width: '3%' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Track your hiring performance and metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <m.icon className={`h-8 w-8 ${m.color}`} />
                <span className="text-sm font-medium text-success">{m.change}</span>
              </div>
              <p className="mt-3 text-3xl font-bold">{m.value}</p>
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hiring Funnel</CardTitle>
          <CardDescription>Conversion from application to hire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnel.map((stage) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">{stage.count}</span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: stage.width }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
