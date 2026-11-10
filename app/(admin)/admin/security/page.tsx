import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, Eye, AlertTriangle } from 'lucide-react';

const securityItems = [
  { icon: ShieldCheck, title: 'Row Level Security', status: 'enabled', desc: 'All database tables have RLS enabled with per-user policies.' },
  { icon: Lock, title: 'Authentication', status: 'enabled', desc: 'Email/password auth with Supabase Auth. Sessions managed server-side.' },
  { icon: Eye, title: 'Audit Logging', status: 'enabled', desc: 'Admin actions are logged for compliance and security review.' },
  { icon: AlertTriangle, title: 'Rate Limiting', status: 'pending', desc: 'API rate limiting needs configuration for production.' },
];

const statusStyles: Record<string, string> = {
  enabled: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
};

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
        <p className="mt-1 text-muted-foreground">Monitor and manage platform security settings.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {securityItems.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={statusStyles[item.status]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </div>
              <CardTitle className="mt-3">{item.title}</CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
