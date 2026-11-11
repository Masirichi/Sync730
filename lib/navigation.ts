import {
  LayoutGrid,
  Compass,
  Columns3,
  Video,
  Briefcase,
  FileCheck2,
  Bookmark,
  MessageSquareText,
  Home,
  Heart,
  Globe,
  FileText,
  MessageSquare,
} from 'lucide-react';

export const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate', icon: LayoutGrid },
  { label: 'Remote Job Feed', href: '/dashboard/crawler', icon: Compass },
  { label: 'Kanban Tracker', href: '/dashboard/tracker', icon: Columns3 },
  { label: 'AI Mock Sandbox', href: '/dashboard/sandbox', icon: Video },
  { label: 'Browse Jobs', href: '/candidate/jobs', icon: Briefcase },
  { label: 'My Applications', href: '/candidate/applications', icon: FileCheck2 },
  { label: 'Saved Jobs', href: '/candidate/saved', icon: Bookmark },
  { label: 'Messages', href: '/candidate/messages', icon: MessageSquareText },
];
