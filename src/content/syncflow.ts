// src/content/syncflow.ts
// Structured content and stages definition for SyncFlow (formerly Kanban Tracker)

export type SyncFlowStageId = 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER';

export interface SyncFlowStage {
  id: SyncFlowStageId;
  label: string;
  description: string;
  badgeColor: string;
  borderColor: string;
}

export const SYNCFLOW_STAGES: SyncFlowStage[] = [
  {
    id: 'SAVED',
    label: 'Saved',
    description: 'Roles you want to review or apply to soon.',
    badgeColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    borderColor: 'border-t-neutral-400',
  },
  {
    id: 'APPLIED',
    label: 'Applied',
    description: 'Applications submitted directly to hiring teams.',
    badgeColor: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    borderColor: 'border-t-neutral-600',
  },
  {
    id: 'INTERVIEWING',
    label: 'Interviewing',
    description: 'Active conversations and evaluation rounds.',
    badgeColor: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
    borderColor: 'border-t-neutral-800 dark:border-t-neutral-400',
  },
  {
    id: 'OFFER',
    label: 'Offer',
    description: 'Offers received and negotiation steps.',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-t-emerald-500',
  },
];

export const SYNCFLOW_COPY = {
  title: 'SyncFlow',
  subtitle: 'Track your applications in one private workspace. Clear stages from saved to offer.',
  addJobModalTitle: 'Add Role to SyncFlow',
  emptyStageMessage: 'No roles in this stage yet.',
} as const;
