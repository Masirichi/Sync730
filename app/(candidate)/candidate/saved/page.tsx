import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, DollarSign } from 'lucide-react';

const savedJobs = [
  { title: 'Senior Frontend Engineer', company: 'TechCorp', location: 'Remote', salary: '$120k–$150k', type: 'Full-time' },
  { title: 'DevOps Engineer', company: 'CloudSys', location: 'Remote', salary: '$130k–$160k', type: 'Full-time' },
];

export default function SavedJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Jobs</h1>
        <p className="mt-1 text-muted-foreground">Jobs you've saved to apply to later.</p>
      </div>
      {savedJobs.length > 0 ? (
        <div className="space-y-4">
          {savedJobs.map((job) => (
            <Card key={job.title}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                    <h3 className="font-semibold">{job.title}</h3>
                    <Badge variant="secondary">{job.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-3">
                    {job.company}
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {job.salary}</span>
                  </p>
                </div>
                <Button size="sm">Apply now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No saved jobs yet. Browse jobs and save the ones you like.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
