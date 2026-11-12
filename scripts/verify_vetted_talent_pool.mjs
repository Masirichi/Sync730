// scripts/verify_vetted_talent_pool.mjs
// Automated Verification Suite for Vetted Talent Pool, Demo Admin Login, Relative Job Matching, and Video Review

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 Running Vetted Talent & Demo Admin Verification Suite');
  console.log(`Target: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Demo Admin Instant Login
    console.log('--- 1. Testing Demo Admin Instant Login ---');
    const demoAdminRes = await fetch(`${BASE_URL}/api/auth/demo-login?role=platform_admin`, {
      method: 'GET',
      redirect: 'manual',
    });

    assert(
      demoAdminRes.status === 307 || demoAdminRes.status === 302,
      `Demo admin endpoint returns 307 redirect (got ${demoAdminRes.status})`
    );

    const redirectLocation = demoAdminRes.headers.get('location') || '';
    assert(
      redirectLocation.includes('/command/metrics'),
      `Redirect target contains /command/metrics (got ${redirectLocation})`
    );

    const setCookie = demoAdminRes.headers.get('set-cookie') || '';
    assert(
      setCookie.includes('sync730-demo-role=platform_admin'),
      `Sets sync730-demo-role=platform_admin cookie`
    );

    // Test Demo Recruiter Login
    const demoRecruiterRes = await fetch(`${BASE_URL}/api/auth/demo-login?role=recruiter_admin`, {
      method: 'GET',
      redirect: 'manual',
    });
    const recruiterRedirect = demoRecruiterRes.headers.get('location') || '';
    assert(
      recruiterRedirect.includes('/console/talent'),
      `Recruiter demo redirects to /console/talent (got ${recruiterRedirect})`
    );
    assert(
      (demoRecruiterRes.headers.get('set-cookie') || '').includes('sync730-recruiter-role=OWNER'),
      `Sets sync730-recruiter-role=OWNER cookie`
    );

    // 2. Test Talent Pool Listing & Filtering (Consent + Availability)
    console.log('\n--- 2. Testing Talent Pool Listing & Consent Filtering ---');
    const talentListRes = await fetch(`${BASE_URL}/api/talent/list`);
    assert(talentListRes.ok, `Talent list API responded with 200 OK`);
    const talentData = await talentListRes.json();

    assert(talentData.success === true, `Response success is true`);
    assert(Array.isArray(talentData.candidates), `Candidates is an array`);
    assert(talentData.candidates.length > 0, `Returned ${talentData.candidates.length} candidates`);

    // Verify non-consenting / not-looking candidate is HIDDEN
    const emekaCand = talentData.candidates.find(
      (c) => c.candidate_id === 'cand-006-emeka-offor' || (c.skills && c.skills.includes('Go') && c.availability === 'Not looking')
    );
    assert(
      !emekaCand,
      `Non-consenting / 'Not looking' candidate (cand-006) is strictly excluded from talent pool`
    );

    // 3. Test Signed Expiring Video URL (15-Minute Lifetime)
    console.log('\n--- 3. Testing 15-Minute Signed Video URL Lifetime ---');
    const firstCand = talentData.candidates[0];
    assert(!!firstCand.secure_video_url, `Candidate has secure_video_url`);
    assert(
      firstCand.secure_video_url.includes('auth_sig=') && firstCand.secure_video_url.includes('expires='),
      `Video URL is HMAC signed with expiry parameters`
    );
    assert(!!firstCand.expires_at, `Video URL has expires_at timestamp`);

    const now = Date.now();
    const remainingMs = firstCand.expires_at - now;
    const fifteenMinMs = 15 * 60 * 1000;
    // Allow small clock drift tolerance (+- 10s)
    assert(
      remainingMs > 13 * 60 * 1000 && remainingMs <= fifteenMinMs + 10000,
      `Signed URL TTL is strictly 15 minutes (remaining: ${Math.round(remainingMs / 1000)}s)`
    );

    // 4. Test Relative Job Match Scoring vs Overall Vetted Benchmark
    console.log('\n--- 4. Testing Relative Match Scoring & Reasons ---');
    // Calling with job_id
    const jobMatchRes = await fetch(`${BASE_URL}/api/talent/list?job_id=job-emp-001`);
    const jobMatchData = await jobMatchRes.json();
    assert(jobMatchData.success === true, `Job-filtered talent list returned successfully`);
    assert(jobMatchData.job_context?.id === 'job-emp-001', `Job context matches requested role`);

    const matchedCand = jobMatchData.candidates[0];
    assert(!!matchedCand.relative_match, `Candidate has relative_match analysis`);
    assert(
      matchedCand.relative_match.isRelativeMatch === true,
      `relative_match.isRelativeMatch is true for specific job`
    );
    assert(
      typeof matchedCand.relative_match.matchScore === 'number' && matchedCand.relative_match.matchScore > 0,
      `Computed numeric matchScore: ${matchedCand.relative_match.matchScore}%`
    );
    assert(
      typeof matchedCand.relative_match.reasonsLabel === 'string' && matchedCand.relative_match.reasonsLabel.includes('Strong in:'),
      `Contains reasons label: "${matchedCand.relative_match.reasonsLabel}"`
    );
    assert(
      Array.isArray(matchedCand.relative_match.breakdown?.matchedSkills),
      `Breakdown includes matchedSkills array (${matchedCand.relative_match.breakdown?.matchedSkills.length} skills)`
    );

    // Calling without job_id (benchmark mode)
    const benchmarkCand = talentData.candidates[0];
    assert(
      benchmarkCand.relative_match?.isRelativeMatch === false,
      `Without job context, isRelativeMatch is false (benchmark mode)`
    );

    // 5. Test Candidate Contact Logging
    console.log('\n--- 5. Testing Candidate Contact Logging ---');
    const contactPayload = {
      workspace_id: 'ws-sync730-demo',
      candidate_id: firstCand.candidate_id,
      contact_type: 'EMAIL',
      recipient: 'jane.masked@sync730-talent.internal',
      subject: 'Interview Invitation: Senior Full Stack Engineer at Acme Global Ventures',
      message_template: 'Hi Jane, we loved your Flowmingo assessment and want to chat.',
    };

    const contactPostRes = await fetch(`${BASE_URL}/api/recruiter/talent/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactPayload),
    });

    assert(contactPostRes.ok, `POST /api/recruiter/talent/contact responded 200 OK`);
    const contactPostData = await contactPostRes.json();
    assert(contactPostData.success === true, `Contact attempt logged successfully`);
    assert(!!contactPostData.contact_log?.id, `Contact log has unique ID: ${contactPostData.contact_log?.id}`);

    // Verify GET retrieves the logged contact
    const contactGetRes = await fetch(
      `${BASE_URL}/api/recruiter/talent/contact?workspace_id=ws-sync730-demo&candidate_id=${firstCand.candidate_id}`
    );
    const contactGetData = await contactGetRes.json();
    assert(contactGetData.success === true, `GET /api/recruiter/talent/contact responded 200 OK`);
    assert(
      contactGetData.logs.some((l) => l.id === contactPostData.contact_log.id),
      `Logged contact found in workspace candidate contact history`
    );

    console.log('\n================================================================');
    console.log(`🏁 Verification Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled verification error:', err);
    process.exit(1);
  }
}

runTests();
