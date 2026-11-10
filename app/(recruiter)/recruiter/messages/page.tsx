import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const conversations = [
  { name: 'Jane Doe', role: 'Senior Frontend Engineer candidate', initials: 'JD', lastMessage: "Thanks for reaching out! I'm available...", time: '1h ago' },
  { name: 'John Smith', role: 'Full Stack Developer candidate', initials: 'JS', lastMessage: "I'd love to learn more about the role.", time: '4h ago' },
  { name: 'Alice Brown', role: 'Product Designer candidate', initials: 'AB', lastMessage: "Sounds great, let's schedule a call.", time: '1d ago' },
];

export default function RecruiterMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-muted-foreground">Communicate with candidates.</p>
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
