// scripts/verify_public_jobs.mjs
// Comprehensive verification test suite for the Public Jobs experience & Profile-Gated Apply Flow

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n=== Starting Public Jobs & Profile-Gated Apply Flow Verification ===\n');

  // Test 1: Logged-out visitor can browse /jobs, reads public fields, never receives apply_url
  console.log('1. Checking Public /jobs List (Logged-Out Visitor)');
  let testSlug = '';
  let allFoundSlugs = [];

  try {
    const res = await fetch(`${BASE_URL}/jobs`);
    const html = await res.text();

    assert(res.status === 200, '/jobs returns 200 without login', `Status: ${res.status}`);
    assert(html.includes('Find roles matched to your craft'), 'Public headline present');
    assert(html.includes('Sign up to apply'), 'Logged-out CTA "Sign up to apply" present');

    // STRICT CHECK: Ensure external apply URL is NEVER leaked in public HTML/response!
    assert(!html.includes('remotive.com/apply') && !html.includes('arbeitnow.com/apply') && !html.includes('"apply_url"'),
      'STRICT PRIVACY: External apply URLs are NEVER present in public /jobs HTML');

    // Test search filter persistence via query string
    const filterRes = await fetch(`${BASE_URL}/jobs?q=engineer&location=nigeria&page=1`);
    assert(filterRes.status === 200, 'Filtered /jobs URL returns 200');

    // Extract active job slugs from the rendered page
    const slugMatches = [...html.matchAll(/href="\/jobs\/([a-z0-9-]+)"/g)].map(m => m[1]);
    allFoundSlugs = Array.from(new Set(slugMatches.filter(s => s && s !== 'jobs')));
    testSlug = allFoundSlugs[0] || 'senior-full-stack-engineer-credit-wellness-global-worldwide-remotive-2086540';
    console.log(`  ℹ Found ${allFoundSlugs.length} live job links. Selected testSlug: "${testSlug}"`);
  } catch (err) {
    assert(false, '/jobs reachable', err.message);
  }

  // Test 2: Checking /jobs/[slug] page
  console.log('\n2. Checking Public /jobs/[slug] Detail Page (Logged-Out Visitor)');
  try {
    const detailRes = await fetch(`${BASE_URL}/jobs/${testSlug}`);
    const detailHtml = await detailRes.text();

    assert(detailRes.status === 200, `/jobs/${testSlug} returns 200`, `Status: ${detailRes.status}`);
    assert(detailHtml.includes('Sign up to apply'), 'Logged-out primary CTA "Sign up to apply" rendered');
    assert(detailHtml.includes(`next=/jobs/${testSlug}`) || detailHtml.includes(`next=%2Fjobs%2F${testSlug}`),
      'CTA preserves job slug in ?next parameter');

    // Verify Schema.org JobPosting JSON-LD
    assert(detailHtml.includes('"@type":"JobPosting"') || detailHtml.includes('"@type": "JobPosting"'),
      'Schema.org JobPosting JSON-LD structured data is present for active jobs');

    // STRICT CHECK: Ensure external apply URL is NEVER leaked to logged-out visitors
    assert(!detailHtml.includes('remotive.com/apply') && !detailHtml.includes('"apply_url"'),
      'STRICT PRIVACY: External apply URL is NOT present in logged-out page source');

    // Check match scores and saved state NOT shown to logged-out visitors
    assert(!detailHtml.includes('% match ·'), 'AI match score is NOT revealed to logged-out visitor');
  } catch (err) {
    assert(false, 'Job detail page verification', err.message);
  }

  // Test 3: Closed job displays "This job is closed" banner and omits JobPosting JSON-LD
  console.log('\n3. Checking Closed Job Behavior');
  try {
    const closedSlug = 'job-emp-004';
    const closedRes = await fetch(`${BASE_URL}/jobs/${closedSlug}`);
    const closedHtml = await closedRes.text();

    assert(closedRes.status === 200, 'Closed job stays reachable with 200 (not 404)');
    assert(closedHtml.includes('This job is closed'), 'Banner "This job is closed" rendered');
    assert(!closedHtml.includes('"@type":"JobPosting"'), 'JobPosting JSON-LD is REMOVED for closed jobs');
    assert(closedHtml.includes('Similar Opportunities You Might Like'), 'Similar jobs recommended');
  } catch (err) {
    assert(false, 'Closed job test error', err.message);
  }

  // Test 4: Apply-Ready Server Enforcement (Reject non-apply-ready users with 403)
  console.log('\n4. Testing Apply-Ready Server Enforcement (403 with Missing Items)');
  const incompleteUserId = `user-incomplete-${Date.now()}`;

  // Direct POST to /api/jobs/[id]/apply without apply-ready profile
  const incompleteApplyRes = await fetch(`${BASE_URL}/api/jobs/${testSlug}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-user-id': incompleteUserId,
    },
    body: JSON.stringify({ cover_note: 'Test application' }),
  });

  const incompleteData = await incompleteApplyRes.json();
  assert(incompleteApplyRes.status === 403, 'Direct apply rejected with HTTP 403 Forbidden', `Status: ${incompleteApplyRes.status}`);
  assert(Array.isArray(incompleteData.missing_items), 'Server returns array of missing_items');
  assert(incompleteData.error?.includes('not apply-ready'), 'Clear error message indicating profile is not apply-ready');

  // Direct GET to /api/jobs/[id]/apply-url without apply-ready profile
  const incompleteUrlRes = await fetch(`${BASE_URL}/api/jobs/${testSlug}/apply-url`, {
    headers: {
      'x-demo-user-id': incompleteUserId,
    },
  });
  assert(incompleteUrlRes.status === 403, 'External apply-url endpoint rejects incomplete candidate with 403');

  // Test 5: Successful 1-Click Application for Apply-Ready Candidate
  console.log('\n5. Testing 1-Click Application for Apply-Ready Candidate');
  const readyUserId = `user-ready-${Date.now()}`;

  // Setup apply-ready profile on server
  const setupProfileRes = await fetch(`${BASE_URL}/api/candidate/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-user-id': readyUserId,
    },
    body: JSON.stringify({
      full_name: 'Babajide Sanwo',
      email: `${readyUserId}@sync730.dev`,
      country: 'Nigeria',
      role_track: 'Software Engineering',
      skills: [
        { name: 'TypeScript', level: 'Expert' },
        { name: 'React', level: 'Advanced' },
        { name: 'Node.js', level: 'Advanced' },
      ],
      years_of_experience: 5,
      experience_level: 'Senior',
      email_verified: true,
      cv_uploaded: true,
      work_history: [
        {
          id: 'w1',
          title: 'Senior Engineer',
          company: 'Fintech Hub',
          start_date: '2021-01',
          current: true,
        },
      ],
    }),
  });

  const profileData = await setupProfileRes.json();
  assert(profileData.apply_ready?.is_apply_ready === true, 'Profile evaluated as apply-ready (all 7 criteria met)');

  // Now apply to the job
  const readyApplyRes = await fetch(`${BASE_URL}/api/jobs/${testSlug}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-user-id': readyUserId,
    },
    body: JSON.stringify({ cover_note: 'I am excited about this role.' }),
  });
  const readyApplyData = await readyApplyRes.json();
  assert(readyApplyRes.status === 200 && readyApplyData.success === true, 'Apply-ready candidate successfully applies (HTTP 200)');

  // Test 6: Duplicate Application to same job is blocked
  console.log('\n6. Testing Duplicate Application Prevention');
  const duplicateApplyRes = await fetch(`${BASE_URL}/api/jobs/${testSlug}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-user-id': readyUserId,
    },
    body: JSON.stringify({ cover_note: 'Duplicate application attempt' }),
  });
  const duplicateData = await duplicateApplyRes.json();
  assert(duplicateApplyRes.status === 400, 'Duplicate application blocked with HTTP 400');
  assert(duplicateData.error?.includes('already applied'), 'Clear message: already applied to this role');

  // Test 7: 21st Application/Click Daily Limit Enforcement
  console.log('\n7. Testing Daily Limit (Max 20 applications/links per day)');
  const heavyUserId = `user-heavy-${Date.now()}`;

  // Read all active slugs from sitemap
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  const allSitemapSlugs = [...sitemapText.matchAll(/<loc>https:\/\/sync730\.com\/jobs\/([^<]+)<\/loc>/g)].map(m => m[1]);

  // Setup heavy user profile
  await fetch(`${BASE_URL}/api/candidate/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-user-id': heavyUserId },
    body: JSON.stringify({
      full_name: 'Active Applicant',
      email: `${heavyUserId}@sync730.dev`,
      country: 'Nigeria',
      role_track: 'Software Engineering',
      skills: [{ name: 'A', level: 'Expert' }, { name: 'B', level: 'Advanced' }, { name: 'C', level: 'Mid' }],
      experience_level: 'Mid',
      email_verified: true,
      cv_uploaded: true,
    }),
  });

  // Submit 20 unique applications across live job slugs
  for (let i = 0; i < 20; i++) {
    const targetJobSlug = allSitemapSlugs[i];
    await fetch(`${BASE_URL}/api/jobs/${targetJobSlug}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user-id': heavyUserId },
      body: JSON.stringify({ cover_note: `Application #${i + 1}` }),
    });
  }

  // 21st application attempt on the 21st unique live job
  const overflowRes = await fetch(`${BASE_URL}/api/jobs/${allSitemapSlugs[20]}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-user-id': heavyUserId },
    body: JSON.stringify({ cover_note: '21st application' }),
  });
  const overflowData = await overflowRes.json();
  assert(overflowRes.status === 429, '21st application blocked with HTTP 429 Too Many Requests');
  assert(overflowData.error?.includes('daily limit of 20'), 'Clear message explaining the 20/day limit');

  // Test 8: Sitemap includes all live jobs
  console.log('\n8. Checking Sitemap Integration');
  assert(sitemapRes.status === 200, '/sitemap.xml returns 200');
  assert(sitemapText.includes('/jobs'), 'sitemap includes base /jobs');
  assert(sitemapText.includes(testSlug), `sitemap includes live job slug /jobs/${testSlug}`);

  console.log(`\n=== Verification Complete: ${passCount} Passed, ${failCount} Failed ===\n`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
