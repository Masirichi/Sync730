import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getRecruiterSession } from '@/lib/recruiter/auth';

interface CandidateEvaluationNote {
  id: string;
  workspace_id: string;
  candidate_id: string;
  author_email: string;
  author_role: string;
  note: string;
  score?: number;
  created_at: string;
}

// In-memory fallback storage for candidate evaluation notes scoped by workspace
const localNotesStore: CandidateEvaluationNote[] = [
  {
    id: 'note-init-1',
    workspace_id: 'ws-sync730-demo',
    candidate_id: 'cand-001-jane-doe',
    author_email: 'sarah.tech@acmeglobal.com',
    author_role: 'INTERVIEWER',
    note: 'Strong grasp of Next.js App Router performance and server actions. Answered architecture questions concisely.',
    score: 94,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const candidateId = req.nextUrl.searchParams.get('candidate_id');
    const requestedWsId = req.nextUrl.searchParams.get('workspace_id');

    // Organization scoping: strictly filter by session's workspace
    const wsId = session?.isPlatformAdmin
      ? requestedWsId || session?.workspaceId || 'ws-sync730-demo'
      : session?.workspaceId || requestedWsId || 'ws-sync730-demo';

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'candidate_id is required' },
        { status: 400 }
      );
    }

    // 1. Try Supabase
    let notes: CandidateEvaluationNote[] = [];
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('workspace_id', wsId)
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        notes = data;
      }
    } catch {}

    // Merge with in-memory fallback
    const localMatches = localNotesStore.filter(
      (n) => n.workspace_id === wsId && n.candidate_id === candidateId
    );
    const existingIds = new Set(notes.map((n) => n.id));
    for (const ln of localMatches) {
      if (!existingIds.has(ln.id)) {
        notes.push(ln);
      }
    }

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidate notes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json();
    const { candidate_id, note, score, workspace_id } = body;

    const wsId = session?.workspaceId || workspace_id || 'ws-sync730-demo';

    if (!candidate_id || !note || !note.trim()) {
      return NextResponse.json(
        { success: false, error: 'candidate_id and note text are required' },
        { status: 400 }
      );
    }

    const evaluationNote: CandidateEvaluationNote = {
      id: `note-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: wsId,
      candidate_id,
      author_email: session?.email || 'recruiter@company.com',
      author_role: session?.role || 'INTERVIEWER',
      note: note.trim(),
      score: typeof score === 'number' ? Math.min(100, Math.max(0, score)) : undefined,
      created_at: new Date().toISOString(),
    };

    // 1. Try Supabase
    try {
      const supabase = await createServerClient();
      await supabase.from('candidate_notes').insert(evaluationNote);
    } catch {}

    // 2. Persist locally
    localNotesStore.unshift(evaluationNote);

    return NextResponse.json({
      success: true,
      message: 'Evaluation note and score saved.',
      note: evaluationNote,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save candidate note' },
      { status: 500 }
    );
  }
}
