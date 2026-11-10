import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const conversations = [
  { name: 'Sarah Chen', role: 'Recruiter at TechCorp', initials: 'SC', lastMessage: 'Hi Jane, I reviewed your application and...', time: '2h ago' },
  { name: 'Mike Johnson', role: 'Recruiter at DesignHub', initials: 'MJ', lastMessage: "Thanks for applying! We'd love to schedule...", time: '1d ago' },
  { name: 'Emily Davis', role: 'Recruiter at StartupXYZ', initials: 'ED', lastMessage: 'Your profile looks great. Are you open to...', time: '3d ago' },
];

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-muted-foreground">Chat directly with recruiters.</p>
      </div>
      <div className="space-y-2">
        {conversations.map((conv) => (
          <Card key={conv.name} className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {conv.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{conv.name}</h3>
                  <span className="text-xs text-muted-foreground">{conv.time}</span>
                </div>
                <p className="text-xs text-muted-foreground">{conv.role}</p>
                <p className="truncate text-sm text-muted-foreground">{conv.lastMessage}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
