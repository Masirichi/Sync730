// scripts/verify_jobs_and_pipeline.mjs
// Automated Verification Suite for Job Management, Post New Role, Pipeline Stages, Scorecards, Interview Scheduling, and CSV Export

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 Running Jobs & Pipeline Verification Suite');
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
    // 0. Setup demo recruiter auth cookie for API authorization
    const loginRes = await fetch(`${BASE_URL}/api/auth/demo-login?role=recruiter_admin`, {
      method: 'GET',
      redirect: 'manual',
    });
    const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || ''];
    const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');
    const authHeaders = {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'x-recruiter-role': 'OWNER',
      'x-workspace-id': 'ws-sync730-demo',
    };

    // 1. Test Post New Role API with Flowmingo Assessment Template & Multi-Currency Salary
    console.log('--- 1. Testing Post New Role API & Salary Formatting ---');
    const newRolePayload = {
      workspace_id: 'ws-sync730-demo',
      job_title: 'Lead Platform Reliability Architect',
      department: 'Engineering',
      seniority: 'Lead',
      employment_type: 'Full-time',
      work_arrangement: 'Remote',
      eligible_regions: ['Nigeria', 'Africa', 'Worldwide'],
      salary_min: 25000000,
      salary_max: 35000000,
      salary_currency: 'NGN',
      salary_period: 'year',
      skills: ['Kubernetes', 'Go', 'Terraform', 'PostgreSQL'],
      description: 'Lead resilient platform infrastructure across pan-African and EMEA edge nodes.',
      requirements: 'Proven background in high-concurrency systems and automated fault recovery.',
      application_deadline: '2026-12-31',
      assessment_template: 'Engineering',
      status: 'active',
    };

    const postJobRes = await fetch(`${BASE_URL}/api/flowmingo/create-project`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newRolePayload),
    });

    assert(postJobRes.ok, `POST /api/flowmingo/create-project returned 200 OK`);
    const postJobData = await postJobRes.json();
    assert(postJobData.success === true, `Role created successfully`);
    const createdJob = postJobData.job;
    assert(!!createdJob?.id, `Created job has ID: ${createdJob?.id}`);
    assert(
      createdJob?.salary_range?.includes('₦'),
      `Salary formatted with Nigerian Naira symbol (₦): "${createdJob?.salary_range}"`
    );
    assert(
      createdJob?.assessment_template === 'Engineering',
      `Assessment template correctly set to "Engineering"`
    );

    // 2. Test Job Management: Pause, Close, Duplicate, Edit
    console.log('\n--- 2. Testing Job Management Actions (Pause, Close, Duplicate, Edit) ---');
    // Pause
    const pauseRes = await fetch(`${BASE_URL}/api/recruiter/jobs/manage`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'status',
        job_id: createdJob.id,
        status: 'paused',
      }),
    });
    const pauseData = await pauseRes.json();
    assert(pauseData.success === true, `Job successfully paused`);
    assert(pauseData.job?.status === 'paused', `Job status updated to 'paused'`);

    // Duplicate
    const dupRes = await fetch(`${BASE_URL}/api/recruiter/jobs/manage`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'duplicate',
        job_id: createdJob.id,
      }),
    });
    const dupData = await dupRes.json();
    assert(dupData.success === true, `Job successfully duplicated`);
    assert(
      dupData.job?.job_title?.includes('(Copy)'),
      `Duplicated job has '(Copy)' suffix in title: "${dupData.job?.job_title}"`
    );
    assert(dupData.job?.status === 'draft', `Duplicated job created as 'draft'`);

    // Close
    const closeRes = await fetch(`${BASE_URL}/api/recruiter/jobs/manage`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'status',
        job_id: createdJob.id,
        status: 'closed',
      }),
    });
    const closeData = await closeRes.json();
    assert(closeData.success === true, `Job successfully closed`);
    assert(closeData.job?.status === 'closed', `Job status updated to 'closed'`);

    // Reactivate for pipeline test
    await fetch(`${BASE_URL}/api/recruiter/jobs/manage`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'status',
        job_id: createdJob.id,
        status: 'active',
      }),
    });

    // 3. Test Pipeline API (Stages, Candidates, Counts)
    console.log('\n--- 3. Testing Pipeline API & Stage Movements ---');
    const pipelineRes = await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline?job_id=job-emp-001`);
    assert(pipelineRes.ok, `GET /api/recruiter/jobs/pipeline returned 200 OK`);
    const pipelineData = await pipelineRes.json();
    assert(pipelineData.success === true, `Pipeline data retrieved`);
    assert(Array.isArray(pipelineData.stages), `Pipeline stages array returned`);
    assert(
      pipelineData.stages.includes('Shortlisted') &&
        pipelineData.stages.includes('Contacted') &&
        pipelineData.stages.includes('Interviewing') &&
        pipelineData.stages.includes('Offer') &&
        pipelineData.stages.includes('Hired') &&
        pipelineData.stages.includes('Rejected'),
      `All 6 stages (Shortlisted, Contacted, Interviewing, Offer, Hired, Rejected) supported`
    );

    const testCandidate = pipelineData.candidates.find((c) => c.stage === 'Shortlisted') || pipelineData.candidates[0];
    assert(!!testCandidate, `Found candidate for pipeline testing: ${testCandidate.masked_id}`);

    // Move to Contacted
    const moveContactedRes = await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'move_stage',
        candidate_id: testCandidate.id,
        stage: 'Contacted',
      }),
    });
    const moveContactedData = await moveContactedRes.json();
    assert(moveContactedData.success === true, `Moved candidate to Contacted`);
    assert(moveContactedData.candidate?.stage === 'Contacted', `Candidate stage updated to Contacted`);

    // 4. Test Strict Mandatory Rejection Reason
    console.log('\n--- 4. Testing Mandatory Rejection Reason Enforcement ---');
    // Attempt rejection WITHOUT reason -> Must fail with 400
    const failRejectRes = await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'move_stage',
        candidate_id: testCandidate.id,
        stage: 'Rejected',
        reason: '', // Empty reason!
      }),
    });
    assert(
      failRejectRes.status === 400,
      `Moving to Rejected without reason correctly blocked with 400 Bad Request`
    );
    const failRejectData = await failRejectRes.json();
    assert(
      failRejectData.error?.includes('rejection reason is required'),
      `Error states rejection reason is required: "${failRejectData.error}"`
    );

    // Rejection WITH reason -> Must succeed
    const validRejectRes = await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'move_stage',
        candidate_id: testCandidate.id,
        stage: 'Rejected',
        reason: 'Skill mismatch: Candidate lacked hands-on Supabase row level security experience.',
      }),
    });
    assert(validRejectRes.ok, `Rejection with documented reason succeeded`);
    const validRejectData = await validRejectRes.json();
    assert(
      validRejectData.candidate?.rejection_reason?.includes('Skill mismatch'),
      `Rejection reason stored on candidate profile`
    );
    assert(
      validRejectData.candidate?.stage_history[0]?.reason?.includes('Skill mismatch'),
      `Rejection reason recorded in stage transition audit history`
    );

    // Move back to Interviewing
    await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'move_stage',
        candidate_id: testCandidate.id,
        stage: 'Interviewing',
      }),
    });

    // 5. Test Team Collaboration: Scorecards & Notes
    console.log('\n--- 5. Testing Team Collaboration (Scorecards & Notes) ---');
    // Submit Scorecard
    const scorecardRes = await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'scorecard',
        candidate_id: testCandidate.id,
        technical_depth: 5,
        problem_solving: 4,
        culture_values: 5,
        communication: 4,
        notes: 'Exceptional system architecture clarity during live review.',
      }),
    });
    assert(scorecardRes.ok, `POST scorecard returned 200 OK`);
    const scorecardData = await scorecardRes.json();
    assert(scorecardData.success === true, `Scorecard submitted successfully`);
    assert(scorecardData.scorecard?.overall_rating === 4.5, `Average rating correctly calculated: 4.5/5.0`);
    assert(
      scorecardData.candidate?.scorecards?.some((s) => s.id === scorecardData.scorecard?.id),
      `Scorecard attached to candidate profile`
    );

    // Add Internal Note
    const noteRes = await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'note',
        candidate_id: testCandidate.id,
        text: 'Coordinating final VP of Engineering interview panel.',
      }),
    });
    assert(noteRes.ok, `POST internal note returned 200 OK`);
    const noteData = await noteRes.json();
    assert(noteData.success === true, `Note added successfully`);

    // 6. Test Interview Scheduling & Calendar (.ics) Dispatch
    console.log('\n--- 6. Testing Interview Scheduling & Calendar (.ics) Dispatch ---');
    const scheduleRes = await fetch(`${BASE_URL}/api/recruiter/jobs/pipeline`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'schedule_interview',
        candidate_id: testCandidate.id,
        scheduled_at: new Date(Date.now() + 3600000 * 48).toISOString(),
        duration_minutes: 60,
        interviewer_emails: ['alex.morgan@acmeglobal.com'],
        meeting_link: 'https://meet.google.com/sync-730-exec',
        notes: 'Executive Engineering Panel',
      }),
    });
    assert(scheduleRes.ok, `POST schedule_interview returned 200 OK`);
    const scheduleData = await scheduleRes.json();
    assert(scheduleData.success === true, `Interview scheduled successfully`);
    assert(
      scheduleData.ics_calendar?.includes('BEGIN:VCALENDAR') && scheduleData.ics_calendar?.includes('END:VCALENDAR'),
      `Generated standard RFC 5545 iCalendar (.ics) invite payload`
    );

    // 7. Test Pipeline CSV Export & Audit Logging
    console.log('\n--- 7. Testing Pipeline CSV Export & Audit Logging ---');
    const exportRes = await fetch(`${BASE_URL}/api/recruiter/jobs/export?job_id=job-emp-001`, {
      headers: authHeaders,
    });
    assert(exportRes.ok, `GET /api/recruiter/jobs/export returned 200 OK`);
    assert(
      exportRes.headers.get('content-type')?.includes('text/csv'),
      `Response content-type is text/csv`
    );
    const csvText = await exportRes.text();
    assert(
      csvText.includes('Candidate ID,Candidate Name / Masked ID,Current Stage,Overall Match %'),
      `CSV includes standard pipeline headers`
    );
    assert(
      csvText.includes('Shortlisted') || csvText.includes('Interviewing'),
      `CSV exports active pipeline candidates`
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
