import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const candidates = [
  { name: 'Jane Doe', role: 'Senior Frontend Engineer', skills: ['React', 'TypeScript', 'Next.js'], match: 95, initials: 'JD' },
  { name: 'John Smith', role: 'Full Stack Developer', skills: ['Node', 'React', 'Postgres'], match: 88, initials: 'JS' },
  { name: 'Alice Brown', role: 'Product Designer', skills: ['Figma', 'UX', 'UI'], match: 82, initials: 'AB' },
  { name: 'Bob Wilson', role: 'DevOps Engineer', skills: ['AWS', 'Docker', 'Kubernetes'], match: 78, initials: 'BW' },
];

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
        <p className="mt-1 text-muted-foreground">Browse and manage your candidate pool.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {candidates.map((c) => (
          <Card key={c.name} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {c.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{c.name}</h3>
                    <Badge variant="secondary" className="text-success">{c.match}% match</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.role}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm">View profile</Button>
                    <Button size="sm" variant="outline">Message</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
