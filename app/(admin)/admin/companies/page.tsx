import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const companies = [
  { name: 'TechCorp', jobs: 12, hires: 8, status: 'verified', initials: 'TC' },
  { name: 'DesignHub', jobs: 5, hires: 3, status: 'verified', initials: 'DH' },
  { name: 'StartupXYZ', jobs: 8, hires: 4, status: 'pending', initials: 'SX' },
  { name: 'CloudSys', jobs: 3, hires: 2, status: 'verified', initials: 'CS' },
  { name: 'DataFlow', jobs: 6, hires: 5, status: 'verified', initials: 'DF' },
];

const statusStyles: Record<string, string> = {
  verified: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
};

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="mt-1 text-muted-foreground">Manage registered companies.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {companies.map((c) => (
          <Card key={c.name}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {c.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.jobs} jobs · {c.hires} hires</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusStyles[c.status]}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline">View details</Button>
                {c.status === 'pending' && <Button size="sm">Verify</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
