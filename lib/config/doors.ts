// lib/config/doors.ts
// Door configurations for Section 12 ("Start where you are")
// Status tags can be updated from 'Early access' to 'Live' without component changes.

export type DoorStatus = 'Live' | 'Early access';
export type DoorAction = 'modal_demo' | 'link_jobs' | 'link_waitlist' | 'modal_enterprise';

export interface DoorItem {
  id: string;
  title: string;
  promise: string;
  status: DoorStatus;
  action: DoorAction;
  href?: string;
}

export const DOORS_CONFIG: DoorItem[] = [
  {
    id: 'hire_with_ai',
    title: 'Hire with AI',
    promise: 'Interview and rank candidates for your open roles.',
    status: 'Live',
    action: 'modal_demo',
  },
  {
    id: 'find_work',
    title: 'Find work',
    promise: 'Curated roles tailored to your profile, open to talent across Africa.',
    status: 'Live',
    action: 'link_jobs',
    href: '/jobs',
  },
  {
    id: 'get_verified',
    title: 'Get verified',
    promise: 'Take one interview and be seen by hiring teams.',
    status: 'Early access',
    action: 'link_waitlist',
    href: '/waitlist',
  },
  {
    id: 'enterprise_solutions',
    title: 'Enterprise solutions',
    promise: 'Team workflows, integrations and a dedicated contact.',
    status: 'Early access',
    action: 'modal_enterprise',
  },
];
