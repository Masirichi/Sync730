import { Briefcase, FileText, MessageSquare, Home, Heart, Globe, KanbanSquare } from 'lucide-react';

export const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate', icon: Home },
  { label: 'Remote Job Feed', href: '/dashboard/crawler', icon: Globe },
  { label: 'Kanban Tracker', href: '/dashboard/tracker', icon: KanbanSquare },
  { label: 'Browse Jobs', href: '/candidate/jobs', icon: Briefcase },
  { label: 'My Applications', href: '/candidate/applications', icon: FileText },
  { label: 'Saved Jobs', href: '/candidate/saved', icon: Heart },
  { label: 'Messages', href: '/candidate/messages', icon: MessageSquare },
];
