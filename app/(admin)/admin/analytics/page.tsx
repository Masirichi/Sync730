import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Building2, TrendingUp } from 'lucide-react';

const metrics = [
  { label: 'Total Users', value: '45,231', change: '+8.2%', icon: Users, color: 'text-primary' },
  { label: 'Active Jobs', value: '2,540', change: '+3.1%', icon: Briefcase, color: 'text-success' },
  { label: 'Companies', value: '812', change: '+1.5%', icon: Building2, color: 'text-warning' },
  { label: 'Revenue (MRR)', value: '$48.2k', change: '+15.3%', icon: TrendingUp, color: 'text-destructive' },
];

const growth = [
  { month: 'Jun', value: '62%' },
  { month: 'Jul', value: '68%' },
  { month: 'Aug', value: '71%' },
  { month: 'Sep', value: '76%' },
  { month: 'Oct', value: '82%' },
  { month: 'Nov', value: '88%' },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide growth and performance metrics.</p>
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
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Month-over-month user growth rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-3 pt-4">
            {growth.map((g) => (
              <div key={g.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center" style={{ height: '160px' }}>
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-primary transition-all"
                    style={{ height: g.value }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{g.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
