// scripts/verify_recruiter_security.mjs
import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function postJson(endpoint, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function getJson(endpoint, headers = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- RECRUITER CONSOLE SECURITY & RBAC AUDIT ---');
  let passCount = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // 1. Audit Token Top-up Endpoint (Must be HTTP 503 locked down)
  const topupRes = await postJson('/api/recruiter/tokens/topup', {
    workspace_id: 'ws-sync730-demo',
    amount: 10,
    paid: true,
  });
  assert(
    topupRes.status === 503 && topupRes.data?.code === 'TOPUP_DISABLED',
    `Token topup route returned 503 locked down with code TOPUP_DISABLED (Got status ${topupRes.status})`
  );

  // 2. Audit Workspace Role Enforcement on Unlock
  // Interviewer cannot unlock candidates
  const interviewerUnlock = await postJson(
    '/api/talent/unlock',
    {
      candidate_id: 'cand-001-jane-doe',
      workspace_id: 'ws-sync730-demo',
    },
    { 'x-recruiter-role': 'INTERVIEWER' }
  );
  assert(
    interviewerUnlock.status === 403,
    `Interviewer role blocked from unlocking candidates (Got status ${interviewerUnlock.status})`
  );

  // 3. Audit Team Invite Role Enforcement & Rate Limiting
  // Interviewer cannot invite colleagues
  const interviewerInvite = await postJson(
    '/api/recruiter/team/invite',
    {
      email: 'test@example.com',
      role: 'INTERVIEWER',
      workspace_id: 'ws-sync730-demo',
    },
    { 'x-recruiter-role': 'INTERVIEWER' }
  );
  assert(
    interviewerInvite.status === 403,
    `Interviewer role blocked from inviting members (Got status ${interviewerInvite.status})`
  );

  // Admin / Owner CAN invite colleague (within rate limit)
  const adminInvite = await postJson(
    '/api/recruiter/team/invite',
    {
      email: `test-${Date.now()}@example.com`,
      role: 'INTERVIEWER',
      workspace_id: 'ws-sync730-demo',
    },
    { 'x-recruiter-role': 'OWNER' }
  );
  assert(
    adminInvite.status === 200 && adminInvite.data?.success === true,
    `Owner/Admin can invite team member (Got status ${adminInvite.status})`
  );

  // 4. Audit Talent Evaluation Notes & Scoring Endpoint
  const noteRes = await postJson(
    '/api/recruiter/talent/notes',
    {
      candidate_id: 'cand-001-jane-doe',
      workspace_id: 'ws-sync730-demo',
      note: 'Candidate exhibited remarkable grasp of SSR streaming and server actions.',
      score: 95,
    },
    { 'x-recruiter-role': 'INTERVIEWER' }
  );
  assert(
    noteRes.status === 200 && noteRes.data?.success === true,
    `Interviewer can submit evaluation note and score (Got status ${noteRes.status})`
  );

  // 5. Audit Candidate Evaluation Notes Fetching (Scoped by workspace)
  const notesFetch = await getJson(
    '/api/recruiter/talent/notes?candidate_id=cand-001-jane-doe&workspace_id=ws-sync730-demo'
  );
  assert(
    notesFetch.status === 200 && Array.isArray(notesFetch.data?.notes) && notesFetch.data?.notes.length > 0,
    `Notes fetched and scoped by workspace (Found ${notesFetch.data?.notes?.length} notes)`
  );

  // 6. Audit Workspace Initializer (Enforces 2 tokens, ignores client body balance)
  const wsInit = await postJson('/api/recruiter/workspace', {
    company_name: `SecurityTest Co ${Date.now()}`,
    token_balance: 999999, // Should be completely IGNORED!
  });
  assert(
    wsInit.status === 200 && wsInit.data?.workspace?.token_balance === 2,
    `Workspace creation enforces server-side default of 2 tokens, ignoring client balance 999999 (Got ${wsInit.data?.workspace?.token_balance})`
  );

  console.log(`\nResults: ${passCount} / ${totalTests} tests passed.`);
  if (passCount === totalTests) {
    console.log('ALL RECRUITER SECURITY & RBAC TESTS PASSED!');
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
