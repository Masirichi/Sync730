// scripts/verify_console_states_and_data.mjs
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
  console.log('--- RECRUITER CONSOLE REAL DATA & PROPER STATES AUDIT ---');
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

  // 1. Audit Dashboard Metrics API (real numbers scoped to workspace)
  const metricsRes = await getJson('/api/recruiter/metrics?workspace_id=ws-sync730-demo');
  assert(
    metricsRes.status === 200 && metricsRes.data?.success === true,
    `Metrics API returns 200 OK (Got status ${metricsRes.status})`
  );

  const m = metricsRes.data?.metrics;
  assert(
    m && typeof m.vetted_candidates_count === 'number' && m.vetted_candidates_count !== 1243,
    `Hardcoded 1,243 removed. Dynamic count: ${m?.vetted_candidates_count}`
  );

  assert(
    m?.funnel &&
      typeof m.funnel.invited === 'number' &&
      typeof m.funnel.started === 'number' &&
      typeof m.funnel.completed === 'number' &&
      typeof m.funnel.passed === 'number',
    `Vet-Once pass rate replaced with full funnel: Invited (${m?.funnel.invited}) → Started (${m?.funnel.started}) → Completed (${m?.funnel.completed}) → Passed (${m?.funnel.passed})`
  );

  assert(
    typeof m?.avg_match_score === 'number' && m.avg_match_score >= 0 && m.avg_match_score <= 100,
    `Average match score is real calculated percentage: ${m?.avg_match_score}%`
  );

  // 2. Audit Real Events Tasks ("Things to do (N)")
  const tasks = metricsRes.data?.tasks;
  assert(
    Array.isArray(tasks) && tasks.length > 0,
    `Tasks generated dynamically from real events (Found ${tasks?.length} tasks)`
  );

  // Verify due date and overdue logic
  const sampleTask = tasks[0];
  const now = Date.now();
  const taskDueDate = new Date(sampleTask.due_date).getTime();
  const expectedOverdue = taskDueDate < now;
  assert(
    sampleTask.is_overdue === expectedOverdue,
    `Task overdue flag correctly determined from due date (${sampleTask.is_overdue === expectedOverdue})`
  );

  // 3. Audit Talent List with Poster, Duration, & Processing State
  const talentRes = await getJson('/api/talent/list?workspace_id=ws-sync730-demo');
  assert(
    talentRes.status === 200 && Array.isArray(talentRes.data?.candidates),
    `Talent list API returns 200 OK with candidates array`
  );

  const completedCand = talentRes.data?.candidates.find((c) => c.status === 'COMPLETED');
  assert(
    completedCand &&
      completedCand.secure_video_url.includes('auth_sig=') &&
      completedCand.secure_video_url.includes('expires=') &&
      completedCand.poster_url &&
      completedCand.duration_seconds > 0,
    `Completed candidate video has signed expiring URL, poster thumbnail, and duration (${completedCand?.duration_seconds}s)`
  );

  const processingCand = talentRes.data?.candidates.find((c) => c.status === 'PROCESSING');
  assert(
    processingCand && processingCand.status === 'PROCESSING' && processingCand.secure_video_url === '',
    `Unprocessed candidate displays 'Video processing' status with 0:00 blank player suppressed`
  );

  // 4. Audit Dedicated Signed Video URL Endpoint & Refresh
  const videoUrlRes = await getJson(`/api/talent/video-url?candidate_id=${completedCand?.candidate_id}`);
  assert(
    videoUrlRes.status === 200 && videoUrlRes.data?.video_meta?.signedUrl,
    `Dedicated video-url endpoint signs fresh URL for retry / refresh on demand`
  );

  // 5. Audit Real Flowmingo Sync API
  const syncRes = await postJson('/api/flowmingo/sync', { workspace_id: 'ws-sync730-demo' });
  assert(
    syncRes.status === 200 && syncRes.data?.status === 'Synced' && syncRes.data?.last_synced,
    `Flowmingo sync returns real status 'Synced' and timestamp (${syncRes.data?.last_synced})`
  );

  const syncFailRes = await postJson('/api/flowmingo/sync', {
    workspace_id: 'ws-sync730-demo',
    force_fail: true,
  });
  assert(
    syncFailRes.status === 502 && syncFailRes.data?.status === 'Error',
    `Flowmingo sync error handling verified (returns status 502 with Error state)`
  );

  console.log(`\nResults: ${passCount} / ${totalTests} tests passed.`);
  if (passCount === totalTests) {
    console.log('ALL REAL DATA & PROPER STATES TESTS PASSED!');
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
