// lib/messages/store.ts
// Client-side persistent messaging store for candidate <-> recruiter communication.

export interface ChatMessage {
  id: string;
  threadId: string;
  sender: 'candidate' | 'recruiter';
  senderName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface MessageThread {
  id: string;
  recruiterName: string;
  recruiterRole: string;
  recruiterCompany: string;
  recruiterInitials: string;
  roleTitle: string;
  roleId?: string;
  isVerifiedEmployer: boolean;
  unreadCount: number;
  updatedAt: string;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'sync730_candidate_messages';

export const INITIAL_MESSAGE_THREADS: MessageThread[] = [
  {
    id: 'thread-paystack-01',
    recruiterName: 'Tunde Adebayo',
    recruiterRole: 'VP People & Talent',
    recruiterCompany: 'Paystack (Stripe)',
    recruiterInitials: 'TA',
    roleTitle: 'Senior Frontend Engineer',
    roleId: 'direct-paystack-staff-frontend-02',
    isVerifiedEmployer: true,
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
    messages: [
      {
        id: 'msg-p1',
        threadId: 'thread-paystack-01',
        sender: 'recruiter',
        senderName: 'Tunde Adebayo',
        content: "Hi Adaeze, I reviewed your profile and SyncFlow application for our Senior Frontend Engineer role. We're really impressed by your Next.js and state management architecture.",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-p2',
        threadId: 'thread-paystack-01',
        sender: 'candidate',
        senderName: 'Adaeze Okonkwo',
        content: "Thank you Tunde! I've been following Paystack's cross-border payment expansion across Africa and would love to discuss how I can contribute to sub-second checkout speeds.",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-p3',
        threadId: 'thread-paystack-01',
        sender: 'recruiter',
        senderName: 'Tunde Adebayo',
        content: "Fantastic. We'd love to schedule a technical chat with our frontend lead this week. What days and times work best for you (WAT)?",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'delivered',
      },
    ],
  },
  {
    id: 'thread-moniepoint-02',
    recruiterName: 'Amara Okafor',
    recruiterRole: 'Head of Engineering Talent',
    recruiterCompany: 'Moniepoint Inc.',
    recruiterInitials: 'AO',
    roleTitle: 'Full Stack Systems Engineer',
    roleId: 'direct-moniepoint-cloud-systems-01',
    isVerifiedEmployer: true,
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14h ago
    messages: [
      {
        id: 'msg-m1',
        threadId: 'thread-moniepoint-02',
        sender: 'recruiter',
        senderName: 'Amara Okafor',
        content: 'Hello Adaeze, noticed your verified profile on Sync730. We have an opening on our core banking platform team for an engineer experienced in high-concurrency Node.js and TypeScript.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-m2',
        threadId: 'thread-moniepoint-02',
        sender: 'candidate',
        senderName: 'Adaeze Okonkwo',
        content: 'Hi Amara, that aligns directly with my distributed systems background. Does this role involve real-time transaction reconciliation and webhook idempotency?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-m3',
        threadId: 'thread-moniepoint-02',
        sender: 'recruiter',
        senderName: 'Amara Okafor',
        content: 'Yes, exactly! High-throughput event processing and zero-downtime ledger consistency. Let me know if you would like me to fast-track your profile for an engineering conversation.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
        status: 'read',
      },
    ],
  },
  {
    id: 'thread-canonical-03',
    recruiterName: 'Sarah Jenkins',
    recruiterRole: 'Principal Technical Recruiter',
    recruiterCompany: 'Canonical',
    recruiterInitials: 'SJ',
    roleTitle: 'Remote Cloud & Linux Engineer',
    roleId: 'canonical-cloud-systems-01',
    isVerifiedEmployer: true,
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2d ago
    messages: [
      {
        id: 'msg-c1',
        threadId: 'thread-canonical-03',
        sender: 'recruiter',
        senderName: 'Sarah Jenkins',
        content: 'Hi Adaeze! Your background in cloud infrastructure and TypeScript caught our attention. Canonical is actively hiring remote engineers across Africa (EMEA timezone).',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-c2',
        threadId: 'thread-canonical-03',
        sender: 'recruiter',
        senderName: 'Sarah Jenkins',
        content: 'Would you be open to connecting for 20 minutes to discuss our open source engineering roadmap and EMEA remote compensation?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        status: 'read',
      },
    ],
  },
];

export function getLocalMessageThreads(): MessageThread[] {
  if (typeof window === 'undefined') return INITIAL_MESSAGE_THREADS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MESSAGE_THREADS));
      return INITIAL_MESSAGE_THREADS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MESSAGE_THREADS;
  }
}

export function saveLocalMessageThreads(threads: MessageThread[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    window.dispatchEvent(new CustomEvent('sync730_messages_updated'));
  } catch (err) {
    console.warn('Failed to save messages to localStorage:', err);
  }
}

export function sendMessage(threadId: string, content: string): MessageThread | null {
  if (!content.trim()) return null;
  const current = getLocalMessageThreads();
  const index = current.findIndex((t) => t.id === threadId);
  if (index === -1) return null;

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    threadId,
    sender: 'candidate',
    senderName: 'Adaeze Okonkwo',
    content: content.trim(),
    timestamp: new Date().toISOString(),
    status: 'sent',
  };

  const updatedThread: MessageThread = {
    ...current[index],
    updatedAt: new Date().toISOString(),
    messages: [...current[index].messages, newMsg],
  };

  const updatedThreads = [
    updatedThread,
    ...current.filter((t) => t.id !== threadId),
  ];

  saveLocalMessageThreads(updatedThreads);
  return updatedThread;
}

export function markThreadAsRead(threadId: string): void {
  const current = getLocalMessageThreads();
  let modified = false;

  const updated = current.map((t) => {
    if (t.id === threadId && t.unreadCount > 0) {
      modified = true;
      return {
        ...t,
        unreadCount: 0,
        messages: t.messages.map((m) => ({ ...m, status: 'read' as const })),
      };
    }
    return t;
  });

  if (modified) {
    saveLocalMessageThreads(updated);
  }
}

export function createNewMessageThread(params: {
  recruiterName: string;
  recruiterCompany: string;
  roleTitle: string;
  initialMessage: string;
}): MessageThread {
  const current = getLocalMessageThreads();
  const threadId = `thread-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const initials = params.recruiterName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'RC';

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    threadId,
    sender: 'candidate',
    senderName: 'Adaeze Okonkwo',
    content: params.initialMessage.trim(),
    timestamp: new Date().toISOString(),
    status: 'sent',
  };

  const newThread: MessageThread = {
    id: threadId,
    recruiterName: params.recruiterName,
    recruiterRole: 'Hiring Team',
    recruiterCompany: params.recruiterCompany,
    recruiterInitials: initials,
    roleTitle: params.roleTitle,
    isVerifiedEmployer: true,
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
    messages: [newMsg],
  };

  saveLocalMessageThreads([newThread, ...current]);
  return newThread;
}
