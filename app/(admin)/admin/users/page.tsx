import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const users = [
  { name: 'Jane Doe', email: 'jane@example.com', role: 'candidate', status: 'active', initials: 'JD' },
  { name: 'Alex Morgan', email: 'alex@techcorp.com', role: 'recruiter', status: 'active', initials: 'AM' },
  { name: 'Sarah Chen', email: 'sarah@designhub.com', role: 'recruiter', status: 'active', initials: 'SC' },
  { name: 'John Smith', email: 'john@example.com', role: 'candidate', status: 'suspended', initials: 'JS' },
  { name: 'Admin User', email: 'admin@talenthub.com', role: 'admin', status: 'active', initials: 'AD' },
];

const roleStyles: Record<string, string> = {
  candidate: 'bg-primary/10 text-primary border-primary/20',
  recruiter: 'bg-success/10 text-success border-success/20',
  admin: 'bg-warning/10 text-warning border-warning/20',
};

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">Manage all platform users.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {users.map((u) => (
              <div key={u.email} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {u.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={roleStyles[u.role]}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </Badge>
                  <Badge variant="outline" className={statusStyles[u.status]}>
                    {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                  </Badge>
                  <Button size="sm" variant="outline">Manage</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
