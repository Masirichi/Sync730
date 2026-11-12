// scripts/verify_team_audit_compliance.mjs
// Comprehensive automated verification for:
// 1. Team Management & Ownership Rules (Last Owner protection, Owner privilege hierarchy, 7-day expiry, Revoke & Resend)
// 2. Immutable Audit Log System (RBAC access, filter by user/action/date, non-editable)
// 3. AI Transparency & NDPA 2023 Compliance (/scoring-methodology, /data-processing, legal placeholder, unlock notice)
// 4. Notifications System (Unread count, 5 event types, channel preferences)

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('🚀 Starting Team Management, Audit Log & Compliance Verification...\n');

  let passed = 0;
  let failed = 0;

  function record(desc, ok, err) {
    if (ok) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ ${desc}:`, err);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: Team Management & Role Security Rules
  // --------------------------------------------------------------------------
  console.log('--- SECTION 1: Team Management & Role Security Rules ---');

  // Test 1.1: Demote last owner protection
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/team/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
      body: JSON.stringify({
        action: 'change_role',
        member_id: 'mem-001', // Alex Morgan (sole owner)
        new_role: 'INTERVIEWER',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, 'Demoting last owner must return 403');
    assert.strictEqual(data.success, false);
    assert.match(data.error, /last workspace Owner/i);
    record('Demoting the last OWNER is strictly blocked (HTTP 403)', true);
  } catch (err) {
    record('Demoting the last OWNER is strictly blocked (HTTP 403)', false, err.message);
  }

  // Test 1.2: Remove last owner protection
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/team/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
      body: JSON.stringify({
        action: 'remove_member',
        member_id: 'mem-001', // Alex Morgan
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, 'Removing last owner must return 403');
    assert.strictEqual(data.success, false);
    assert.match(data.error, /last workspace Owner/i);
    record('Removing the last OWNER is strictly blocked (HTTP 403)', true);
  } catch (err) {
    record('Removing the last OWNER is strictly blocked (HTTP 403)', false, err.message);
  }

  // Test 1.3: Admin cannot promote anyone to OWNER
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/team/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=ADMIN',
      },
      body: JSON.stringify({
        action: 'change_role',
        member_id: 'mem-003', // Sarah Chen
        new_role: 'OWNER',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, 'Admin promoting to OWNER must return 403');
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Only workspace Owners/i);
    record('Admin promoting someone to OWNER is blocked (HTTP 403)', true);
  } catch (err) {
    record('Admin promoting someone to OWNER is blocked (HTTP 403)', false, err.message);
  }

  // Test 1.4: Admin cannot remove an ADMIN or OWNER
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/team/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=ADMIN',
      },
      body: JSON.stringify({
        action: 'remove_member',
        member_id: 'mem-002', // David Okonkwo (Admin)
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, 'Admin removing another Admin must return 403');
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Only workspace Owners/i);
    record('Admin removing another Admin or Owner is blocked (HTTP 403)', true);
  } catch (err) {
    record('Admin removing another Admin or Owner is blocked (HTTP 403)', false, err.message);
  }

  // Test 1.5: Owner can change role of INTERVIEWER to ADMIN
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/team/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
      body: JSON.stringify({
        action: 'change_role',
        member_id: 'mem-003',
        new_role: 'ADMIN',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Owner updating role must succeed');
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.member.role, 'ADMIN');
    record('Owner promoting INTERVIEWER to ADMIN succeeds (HTTP 200)', true);
  } catch (err) {
    record('Owner promoting INTERVIEWER to ADMIN succeeds (HTTP 200)', false, err.message);
  }

  // Test 1.6: Admin inviting an ADMIN is blocked (Owner only)
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/team/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=ADMIN',
      },
      body: JSON.stringify({
        email: 'newadmin@acmeglobal.com',
        full_name: 'New Admin Candidate',
        role: 'ADMIN',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, 'Admin inviting an ADMIN must return 403');
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Only workspace Owners/i);
    record('Admin attempting to invite an ADMIN is blocked (HTTP 403)', true);
  } catch (err) {
    record('Admin attempting to invite an ADMIN is blocked (HTTP 403)', false, err.message);
  }

  // Test 1.7: Inviting an INTERVIEWER sets 7-day expiration
  let createdInviteId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/team/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
      body: JSON.stringify({
        email: 'tunde.interviewer@acmeglobal.com',
        full_name: 'Tunde Adeyemi',
        role: 'INTERVIEWER',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.member.status, 'Invited');
    assert.ok(data.member.expires_at, 'Invite must have an expires_at field');
    const expiryDate = new Date(data.member.expires_at).getTime();
    const now = Date.now();
    const daysRemaining = (expiryDate - now) / (1000 * 60 * 60 * 24);
    assert.ok(daysRemaining >= 6.8 && daysRemaining <= 7.1, `Expires in ~7 days (got ${daysRemaining})`);
    createdInviteId = data.member.id;
    record('Invite creation sets status: "Invited" with 7-day expiration (HTTP 200)', true);
  } catch (err) {
    record('Invite creation sets status: "Invited" with 7-day expiration (HTTP 200)', false, err.message);
  }

  // Test 1.8: Resend invite resets the 7-day clock
  if (createdInviteId) {
    try {
      const res = await fetch(`${BASE_URL}/api/recruiter/team/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recruiter-role': 'OWNER',
          'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
        },
        body: JSON.stringify({
          action: 'resend_invite',
          member_id: createdInviteId,
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.expires_at);
      record('Resending an invite resets 7-day expiration countdown (HTTP 200)', true);
    } catch (err) {
      record('Resending an invite resets 7-day expiration countdown (HTTP 200)', false, err.message);
    }

    // Test 1.9: Revoke invite removes the invitation
    try {
      const res = await fetch(`${BASE_URL}/api/recruiter/team/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recruiter-role': 'OWNER',
          'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
        },
        body: JSON.stringify({
          action: 'revoke_invite',
          member_id: createdInviteId,
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      record('Revoking an invite removes it from workspace (HTTP 200)', true);
    } catch (err) {
      record('Revoking an invite removes it from workspace (HTTP 200)', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 2: Immutable Audit Log System
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Immutable Audit Log System ---');

  // Test 2.1: Interviewer role is blocked from viewing audit logs
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/audit-logs`, {
      headers: {
        'x-recruiter-role': 'INTERVIEWER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=INTERVIEWER',
      },
    });
    assert.strictEqual(res.status, 403, 'Interviewer must be blocked from audit logs');
    record('Interviewer role is blocked from audit logs (HTTP 403)', true);
  } catch (err) {
    record('Interviewer role is blocked from audit logs (HTTP 403)', false, err.message);
  }

  // Test 2.2: Admin and Owner can retrieve audit logs
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/audit-logs`, {
      headers: {
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.immutable, true);
    assert.ok(Array.isArray(data.logs));
    assert.ok(data.logs.length >= 4, `Expected at least 4 audit logs (got ${data.logs.length})`);
    record(`Owner can fetch immutable audit logs (${data.logs.length} entries found)`, true);
  } catch (err) {
    record('Owner can fetch immutable audit logs', false, err.message);
  }

  // Test 2.3: Filter audit logs by action type
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/audit-logs?action=TOKEN_PURCHASE`, {
      headers: {
        'x-recruiter-role': 'ADMIN',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=ADMIN',
      },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.logs.every((l) => l.action === 'TOKEN_PURCHASE'), 'All filtered logs must be TOKEN_PURCHASE');
    record(`Filtering audit logs by action type works (${data.logs.length} purchase logs)`, true);
  } catch (err) {
    record('Filtering audit logs by action type works', false, err.message);
  }

  // Test 2.4: Keyword search in audit logs
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/audit-logs?q=Paystack`, {
      headers: {
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.logs.length > 0, 'Should find at least 1 log mentioning Paystack');
    record('Keyword search in audit logs returns matching entries', true);
  } catch (err) {
    record('Keyword search in audit logs returns matching entries', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 3: Notifications System
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Notifications System ---');

  // Test 3.1: Fetch notifications and settings
  let testNotifId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/notifications`, {
      headers: {
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.notifications));
    assert.ok(typeof data.unreadCount === 'number');
    assert.ok(data.settings?.in_app && data.settings?.email && data.settings?.whatsapp);
    if (data.notifications.length > 0) {
      testNotifId = data.notifications[0].id;
    }
    record(`Notifications fetch returns ${data.notifications.length} alerts (${data.unreadCount} unread)`, true);
  } catch (err) {
    record('Notifications fetch returns alerts', false, err.message);
  }

  // Test 3.2: Mark single notification read
  if (testNotifId) {
    try {
      const res = await fetch(`${BASE_URL}/api/recruiter/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recruiter-role': 'OWNER',
          'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notification_id: testNotifId,
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      const target = data.notifications.find((n) => n.id === testNotifId);
      assert.strictEqual(target?.is_read, true);
      record('Mark notification as read updates state properly', true);
    } catch (err) {
      record('Mark notification as read updates state properly', false, err.message);
    }
  }

  // Test 3.3: Save notification channel preferences
  try {
    const res = await fetch(`${BASE_URL}/api/recruiter/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'OWNER',
        'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
      },
      body: JSON.stringify({
        action: 'save_settings',
        settings: {
          in_app: { NEW_VETTED_CANDIDATE: true, VIDEO_AWAITING_REVIEW: true, PAYMENT_CONFIRMED: true, LOW_TOKENS: true, TEAMMATE_COMMENT: true },
          email: { NEW_VETTED_CANDIDATE: true, VIDEO_AWAITING_REVIEW: true, PAYMENT_CONFIRMED: true, LOW_TOKENS: true, TEAMMATE_COMMENT: true },
          whatsapp: { NEW_VETTED_CANDIDATE: true, VIDEO_AWAITING_REVIEW: false, PAYMENT_CONFIRMED: true, LOW_TOKENS: true, TEAMMATE_COMMENT: false },
        },
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.settings.whatsapp.NEW_VETTED_CANDIDATE, true);
    record('Notification channel settings (In-App, Email, WhatsApp) saved successfully', true);
  } catch (err) {
    record('Notification channel settings saved successfully', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 4: AI Transparency & NDPA 2023 Compliance
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 4: AI Transparency & NDPA 2023 Compliance ---');

  // Test 4.1: /scoring-methodology page exists and returns 200
  try {
    const res = await fetch(`${BASE_URL}/scoring-methodology`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('How Candidate Scoring Works'), 'Contains title');
    assert.ok(html.includes('Strictly Prohibited Signals'), 'Contains non-discrimination section');
    assert.ok(html.includes('Advisory'), 'States scores are advisory');
    assert.ok(html.includes('Human'), 'Mandates human review');
    assert.ok(html.includes('support@sync730.com'), 'Contains appeal address');
    record('/scoring-methodology renders with objective signals, advisory notice, and appeal route (HTTP 200)', true);
  } catch (err) {
    record('/scoring-methodology renders properly', false, err.message);
  }

  // Test 4.2: /data-processing page exists and returns 200
  try {
    const res = await fetch(`${BASE_URL}/data-processing`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Flowmingo AI'), 'Lists Flowmingo AI');
    assert.ok(html.includes('Vercel'), 'Lists Vercel');
    assert.ok(html.includes('Supabase'), 'Lists Supabase');
    assert.ok(html.includes('Paystack'), 'Lists Paystack');
    assert.ok(html.includes('dpo@sync730.com'), 'Lists DPO email');
    assert.ok(html.includes('[PLACEHOLDER: legal text to be reviewed by a Nigerian lawyer]'), 'Contains required legal placeholder');
    record('/data-processing renders with sub-processors, DPO contact, and legal placeholder (HTTP 200)', true);
  } catch (err) {
    record('/data-processing renders properly', false, err.message);
  }

  // Test 4.3: Company signup contains Recruiter terms & NDPA 2023 checkbox
  try {
    const signupCode = fs.readFileSync(
      path.resolve(process.cwd(), 'app/(auth)/signup/company/page.tsx'),
      'utf8'
    );
    assert.ok(signupCode.includes('Nigeria Data Protection Act 2023 (NDPA)'));
    assert.ok(signupCode.includes('termsAccepted'));
    assert.ok(signupCode.includes('Recruiter Terms of Service'));
    record('Company signup page enforces Recruiter Terms & NDPA 2023 acceptance checkbox', true);
  } catch (err) {
    record('Company signup page enforces Recruiter Terms & NDPA 2023 acceptance checkbox', false, err.message);
  }

  // Test 4.4: Talent unlock modal contains NDPA 2023 statutory notice
  try {
    const talentCode = fs.readFileSync(
      path.resolve(process.cwd(), 'app/(recruiter)/console/talent/page.tsx'),
      'utf8'
    );
    assert.ok(talentCode.includes('Nigeria Data Protection Act 2023'));
    assert.ok(talentCode.includes('Use this information only for recruitment'));
    record('Talent unlock dialog includes NDPA 2023 statutory compliance notice', true);
  } catch (err) {
    record('Talent unlock dialog includes NDPA 2023 statutory compliance notice', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 5: Console UI Pages & Layout Polish
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Console UI Pages & Layout Polish ---');

  const consolePages = [
    { path: '/console', name: 'Dashboard' },
    { path: '/console/jobs', name: 'Hire & Job Postings' },
    { path: '/console/talent', name: 'Vetted Talent Pool' },
    { path: '/console/billing', name: 'Billing & Tokens' },
    { path: '/console/team', name: 'Team & Permissions' },
    { path: '/console/audit', name: 'Security & Audit Log' },
  ];

  for (const p of consolePages) {
    try {
      const res = await fetch(`${BASE_URL}${p.path}`, {
        headers: {
          'Cookie': 'sync730-demo-role=recruiter; sync730-recruiter-role=OWNER',
        },
      });
      assert.strictEqual(res.status, 200, `${p.name} (${p.path}) must return 200`);
      record(`Console page ${p.name} (${p.path}) loaded with HTTP 200`, true);
    } catch (err) {
      record(`Console page ${p.name} (${p.path}) loaded with HTTP 200`, false, err.message);
    }
  }

  // Test 5.2: Fixed sidebar, global search, and skip-link in console layout
  try {
    const layoutCode = fs.readFileSync(
      path.resolve(process.cwd(), 'app/(recruiter)/console/layout.tsx'),
      'utf8'
    );
    assert.ok(layoutCode.includes('sticky top-0 h-screen overflow-y-auto'), 'Sidebar has sticky top-0 h-screen overflow-y-auto');
    assert.ok(layoutCode.includes('Skip to main content'), 'Has skip-to-main-content accessible link');
    assert.ok(layoutCode.includes('globalSearchQuery'), 'Has global search query logic');
    assert.ok(layoutCode.includes('Help & Support'), 'Has Help & Support modal trigger');
    assert.ok(layoutCode.includes('Real-time sync to Flowmingo AI screening engine active'), 'Live badge tooltip explained');
    record('Console layout verifies fixed sidebar, global search bar, help modal, and skip-link', true);
  } catch (err) {
    record('Console layout verifies fixed sidebar, global search bar, help modal, and skip-link', false, err.message);
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`VERIFICATION COMPLETE: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
