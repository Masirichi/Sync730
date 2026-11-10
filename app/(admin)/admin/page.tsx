import { Card, CardContent } from '@/components/ui/card';
import { Users, Briefcase, Building2, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Total Users', value: '45,231', change: '+8.2%', icon: Users, color: 'text-primary' },
  { label: 'Active Jobs', value: '2,540', change: '+3.1%', icon: Briefcase, color: 'text-success' },
  { label: 'Companies', value: '812', change: '+1.5%', icon: Building2, color: 'text-warning' },
  { label: 'Platform Hires', value: '10,234', change: '+12.4%', icon: TrendingUp, color: 'text-destructive' },
];

const recentUsers = [
  { name: 'Jane Doe', role: 'Candidate', email: 'jane@example.com', joined: 'Nov 9, 2026' },
  { name: 'Alex Morgan', role: 'Recruiter', email: 'alex@techcorp.com', joined: 'Nov 8, 2026' },
  { name: 'Sarah Chen', role: 'Recruiter', email: 'sarah@designhub.com', joined: 'Nov 7, 2026' },
  { name: 'John Smith', role: 'Candidate', email: 'john@example.com', joined: 'Nov 6, 2026' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide overview and management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <span className="text-sm font-medium text-success">{s.change}</span>
              </div>
              <p className="mt-3 text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold">Recent Users</h2>
          </div>
          <div className="divide-y divide-border/60">
            {recentUsers.map((u) => (
              <div key={u.email} className="flex items-center justify-between px-6 py-4">
                <div className="space-y-0.5">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{u.role}</span>
                  <span className="text-xs text-muted-foreground">{u.joined}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
