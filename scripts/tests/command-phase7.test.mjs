import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

test('Phase 7: Users & Roles (/command/users) table, plain text roles, and server-side suspend/restore', async () => {
  const usersPagePath = path.join(ROOT_DIR, 'app/(admin)/command/users/page.tsx');
  const usersPageContent = fs.readFileSync(usersPagePath, 'utf8');

  // Verify Table Columns
  assert.ok(usersPageContent.includes('Name'), 'Must have Name column');
  assert.ok(usersPageContent.includes('Email'), 'Must have Email column');
  assert.ok(usersPageContent.includes('Role'), 'Must have Role column');
  assert.ok(usersPageContent.includes('Workspace'), 'Must have Workspace column');
  assert.ok(usersPageContent.includes('Status'), 'Must have Status column');
  assert.ok(usersPageContent.includes('Last active'), 'Must have Last active column');
  assert.ok(usersPageContent.includes('Joined'), 'Must have Joined column');

  // Verify Plain text role (No pills/badges)
  assert.ok(!usersPageContent.includes('<Badge'), 'Role in table must be plain text without Badge component');
  assert.ok(usersPageContent.includes('getRolePlainText'), 'Must use plain text formatter for roles');

  // Verify Row Menu actions
  assert.ok(usersPageContent.includes('Change role...'), 'Must offer Change role in row menu');
  assert.ok(usersPageContent.includes('Suspend user...'), 'Must offer Suspend user in row menu');
  assert.ok(usersPageContent.includes('Restore account...'), 'Must offer Restore account in row menu');
  assert.ok(usersPageContent.includes('/command/audit?user='), 'Must link to audit log filtered by user');

  // Verify Pagination of 25 per page
  assert.ok(usersPageContent.includes('PAGE_SIZE = 25'), 'Must enforce 25 items per page pagination');

  // Verify Server-side enforcement in API
  const usersApiPath = path.join(ROOT_DIR, 'app/api/admin/users/route.ts');
  const usersApiContent = fs.readFileSync(usersApiPath, 'utf8');

  assert.ok(usersApiContent.includes("requireReason(reason || body.notes, 10)"), 'Server must enforce min 10 chars reason');
  assert.ok(usersApiContent.includes("action === 'SUSPEND'"), 'Must handle SUSPEND action');
  assert.ok(usersApiContent.includes("USER_SUSPENDED"), 'Must record USER_SUSPENDED in audit log');
  assert.ok(usersApiContent.includes("USER_RESTORED"), 'Must record USER_RESTORED in audit log');
  assert.ok(usersApiContent.includes("include_demo"), 'Must support demo user filtering');
});

test('Phase 7: Employers (/command/employers) table, metrics layer agreement, and token adjustment', async () => {
  const empPagePath = path.join(ROOT_DIR, 'app/(admin)/command/employers/page.tsx');
  const empPageContent = fs.readFileSync(empPagePath, 'utf8');

  // Verify Table Columns
  assert.ok(empPageContent.includes('Company'), 'Must have Company column');
  assert.ok(empPageContent.includes('Workspace'), 'Must have Workspace column');
  assert.ok(empPageContent.includes('Roles posted'), 'Must have Roles posted column');
  assert.ok(empPageContent.includes('Roles live'), 'Must have Roles live column');
  assert.ok(empPageContent.includes('Interviews run'), 'Must have Interviews run column');
  assert.ok(empPageContent.includes('Token balance'), 'Must have Token balance column');
  assert.ok(empPageContent.includes('Last active'), 'Must have Last active column');

  // Verify Row Menu actions
  assert.ok(empPageContent.includes('Adjust tokens...'), 'Must offer Adjust tokens in row menu');
  assert.ok(empPageContent.includes('View as employer'), 'Must offer View as employer link to recruiter console');

  // Verify API endpoint
  const empApiPath = path.join(ROOT_DIR, 'app/api/admin/employers/route.ts');
  assert.ok(fs.existsSync(empApiPath), 'Employers API route must exist');
  const empApiContent = fs.readFileSync(empApiPath, 'utf8');
  assert.ok(empApiContent.includes('roles_posted'), 'Must return roles_posted');
  assert.ok(empApiContent.includes('roles_live'), 'Must return roles_live');
  assert.ok(empApiContent.includes('interviews_run'), 'Must return interviews_run');
});

test('Phase 7: Tokens & Payments (/command/money) split revenue, refund flow, and CSV audit export', async () => {
  const moneyPagePath = path.join(ROOT_DIR, 'app/(admin)/command/money/page.tsx');
  const moneyPageContent = fs.readFileSync(moneyPagePath, 'utf8');

  // Verify Header metrics
  assert.ok(moneyPageContent.includes('Revenue this month (Live)'), 'Must display live revenue header');
  assert.ok(moneyPageContent.includes('Employer tokens:'), 'Must split employer tokens revenue');
  assert.ok(moneyPageContent.includes('Candidate tools:'), 'Must split candidate tools revenue');
  assert.ok(moneyPageContent.includes('Refunds this month (Live)'), 'Must display refunds this month');
  assert.ok(moneyPageContent.includes('Transactions this month (Live)'), 'Must display transactions this month');

  // Verify Ledger Columns
  assert.ok(moneyPageContent.includes('Date'), 'Must have Date column');
  assert.ok(moneyPageContent.includes('Payer'), 'Must have Payer column');
  assert.ok(moneyPageContent.includes('Type'), 'Must have Type column');
  assert.ok(moneyPageContent.includes('Amount'), 'Must have Amount column');
  assert.ok(moneyPageContent.includes('Paystack reference'), 'Must have Paystack reference column');
  assert.ok(moneyPageContent.includes('Status'), 'Must have Status column');
  assert.ok(moneyPageContent.includes('Mode'), 'Must have Mode column');

  // Verify Refund flow
  const refundApiPath = path.join(ROOT_DIR, 'app/api/admin/transactions/refund/route.ts');
  assert.ok(fs.existsSync(refundApiPath), 'Refund API route must exist');
  const refundApiContent = fs.readFileSync(refundApiPath, 'utf8');
  assert.ok(refundApiContent.includes('requireReason(reason, 10)'), 'Refund must require min 10 chars reason');
  assert.ok(refundApiContent.includes('PAYMENT_REFUNDED'), 'Refund must log PAYMENT_REFUNDED audit entry');
  assert.ok(refundApiContent.includes('paystack_instruction'), 'Must report Paystack instructions');

  // Verify CSV export route
  const exportApiPath = path.join(ROOT_DIR, 'app/api/admin/transactions/export/route.ts');
  assert.ok(fs.existsSync(exportApiPath), 'Export CSV API route must exist');
  const exportApiContent = fs.readFileSync(exportApiPath, 'utf8');
  assert.ok(exportApiContent.includes('DATA_EXPORT'), 'CSV export must be audit-logged');
  assert.ok(exportApiContent.includes('PLATFORM_ADMIN') || exportApiContent.includes('finance'), 'Must restrict export to authorized roles');
});

test('Phase 7: Candidate payments NEVER affect candidate ranking or job visibility', async () => {
  const jobsApiPath = path.join(ROOT_DIR, 'lib/jobs/service.ts');
  const jobsApiContent = fs.readFileSync(jobsApiPath, 'utf8');

  // Verify job ranking queries never check candidate transactions or tool purchases
  assert.ok(!jobsApiContent.includes('platform_transactions'), 'Jobs query must never touch platform transactions');
  assert.ok(!jobsApiContent.includes('tool_name'), 'Jobs query must never touch candidate tool names');
  assert.ok(!jobsApiContent.includes('is_paid_candidate'), 'Jobs query has zero knowledge of candidate payments');

  const talentApiPath = path.join(ROOT_DIR, 'app/api/talent/list/route.ts');
  if (fs.existsSync(talentApiPath)) {
    const talentApiContent = fs.readFileSync(talentApiPath, 'utf8');
    assert.ok(!talentApiContent.includes('platform_transactions'), 'Talent search must never sort by transactions');
    assert.ok(!talentApiContent.includes('payment_status'), 'Talent ranking has no payment status boost');
  }
});
