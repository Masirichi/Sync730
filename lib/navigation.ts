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
  User,
} from 'lucide-react';

export const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate', icon: LayoutGrid },
  { label: 'Browse Jobs', href: '/find-work', icon: Briefcase },
  { label: 'SyncFlow', href: '/dashboard/syncflow', icon: Columns3 },
  { label: 'Interview Coach', href: '/dashboard/coach', icon: Video },
  { label: 'Candidate Profile', href: '/dashboard/profile', icon: User },
  { label: 'My Applications', href: '/candidate/applications', icon: FileCheck2 },
  { label: 'Saved Jobs', href: '/candidate/saved', icon: Bookmark },
  { label: 'Messages', href: '/candidate/messages', icon: MessageSquareText },
];
