// scripts/tests/command-phase1-safe-actions.test.mjs
// Test suite for Phase 1: Make dangerous actions safe with server-side enforcement.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('1. Database Migration: append-only audit_log table with trigger', () => {
  const migPath = path.resolve('supabase/migrations/20261116_phase1_safe_dangerous_actions.sql');
  assert.ok(fs.existsSync(migPath), 'Migration file must exist');

  const content = fs.readFileSync(migPath, 'utf8');
  assert.ok(content.includes('CREATE TABLE IF NOT EXISTS public.audit_log'), 'Must create public.audit_log');
  assert.ok(content.includes('actor_id TEXT NOT NULL'), 'Must have actor_id');
  assert.ok(content.includes('actor_name TEXT'), 'Must have actor_name');
  assert.ok(content.includes('target_type TEXT NOT NULL'), 'Must have target_type');
  assert.ok(content.includes('target_id TEXT'), 'Must have target_id');
  assert.ok(content.includes('target_label TEXT'), 'Must have target_label');
  assert.ok(content.includes('reason TEXT NOT NULL'), 'Must have reason');
  assert.ok(content.includes('before JSONB'), 'Must have before JSONB');
  assert.ok(content.includes('after JSONB'), 'Must have after JSONB');
  assert.ok(content.includes('created_at TIMESTAMPTZ'), 'Must have created_at');
  assert.ok(content.includes('ip TEXT'), 'Must have ip');
  assert.ok(content.includes('trg_audit_log_immutable'), 'Must define immutable trigger');
  assert.ok(content.includes('UPDATE and DELETE operations are strictly prohibited'), 'Must raise exception on update or delete');
});

test('2. Confirmation Dialog: reusable component with reason validation and cancel focus', () => {
  const dialogPath = path.resolve('components/admin/confirmation-dialog.tsx');
  assert.ok(fs.existsSync(dialogPath), 'ConfirmationDialog component must exist');

  const content = fs.readFileSync(dialogPath, 'utf8');
  assert.ok(content.includes('cancelButtonRef.current?.focus()'), 'Cancel button must be focused by default');
  assert.ok(content.includes('trimmedReason.length >= 10'), 'Must enforce minimum 10 characters for reason');
  assert.ok(content.includes('isDestructive'), 'Must support destructive button styling');
  assert.ok(content.includes('actionLabel'), 'Primary button must name the action');
});

test('3. Role Changes: server-side reason, re-auth, self-demotion and last-admin guards', () => {
  const routePath = path.resolve('app/api/admin/users/route.ts');
  const content = fs.readFileSync(routePath, 'utf8');

  assert.ok(content.includes('requireReason(reason || body.notes, 10)'), 'Must enforce min 10 character reason');
  assert.ok(content.includes('verifyAdminReauth'), 'Must enforce re-authentication for admin role changes');
  assert.ok(content.includes('Self-demotion is prohibited'), 'Must block self-demotion server-side');
  assert.ok(content.includes('Cannot remove the last remaining platform admin'), 'Must block removing last admin server-side');
  assert.ok(content.includes('recordDangerousAuditLog'), 'Must record audit log with before/after state diff');

  // Verify UI removed pink pill and replaced with quiet dropdown menu
  const usersPagePath = path.resolve('app/(admin)/command/users/page.tsx');
  const uiContent = fs.readFileSync(usersPagePath, 'utf8');
  assert.ok(!uiContent.includes('bg-rose-600'), 'Must not contain pink button styling for role promotion');
  assert.ok(!uiContent.includes('>Make Admin<'), 'Must not contain plain Make Admin button');
  assert.ok(uiContent.includes('ConfirmationDialog'), 'Must render ConfirmationDialog on role change');
  assert.ok(uiContent.includes('MoreHorizontal'), 'Must use quiet row menu icon');
});

test('4. Token Adjustments: direction, sane upper limit, negative balance prevention, row menu', () => {
  const routePath = path.resolve('app/api/admin/workspaces/adjust-tokens/route.ts');
  const content = fs.readFileSync(routePath, 'utf8');

  assert.ok(content.includes('requireReason'), 'Must require mandatory reason');
  assert.ok(content.includes('MAX_TOKEN_ADJUSTMENT'), 'Must enforce maximum token adjustment upper limit');
  assert.ok(content.includes('updatedBalance < 0'), 'Must block resulting negative balance server-side');
  assert.ok(content.includes('recordDangerousAuditLog'), 'Must record audit log with before/after diff');

  // UI verification
  const financePagePath = path.resolve('app/(admin)/command/finance/page.tsx');
  const uiContent = fs.readFileSync(financePagePath, 'utf8');
  assert.ok(uiContent.includes('MoreHorizontal'), 'Must trigger adjustment from row menu');
  assert.ok(uiContent.includes('Balance: {currentBal}'), 'Must display live balance preview');
  assert.ok(uiContent.includes('ConfirmationDialog'), 'Must use reusable ConfirmationDialog');
});

test('5. Crawler and Seeding: secondary button, telemetry dialog, needs-review default, production guard', () => {
  const crawlerRoutePath = path.resolve('app/api/cron/crawl-jobs/route.ts');
  const crawlerContent = fs.readFileSync(crawlerRoutePath, 'utf8');

  assert.ok(crawlerContent.includes("review_status: 'needs-review'"), 'New crawled jobs must enter as needs-review');
  assert.ok(crawlerContent.includes('is_active: false'), 'New crawled jobs must default to inactive/hidden');
  assert.ok(crawlerContent.includes('role_verified_at: null'), 'New crawled jobs must have unverified timestamp');

  // Verify metrics page crawler UI
  const metricsPagePath = path.resolve('app/(admin)/command/metrics/page.tsx');
  const metricsContent = fs.readFileSync(metricsPagePath, 'utf8');
  assert.ok(metricsContent.includes('variant="outline"'), 'Trigger crawler must be secondary button');
  assert.ok(metricsContent.includes('ConfirmationDialog'), 'Must open confirmation dialog with run info and sources');
  assert.ok(metricsContent.includes('Needs review (Not public)'), 'Must clarify jobs enter as non-public');

  // Verify Seed Lagos & Abuja Roles environment guard
  const adminJobsRoutePath = path.resolve('app/api/admin/jobs/route.ts');
  const adminJobsContent = fs.readFileSync(adminJobsRoutePath, 'utf8');
  assert.ok(
    adminJobsContent.includes("process.env.NODE_ENV === 'production'") && adminJobsContent.includes('404'),
    'Seed endpoint must return 404 in production'
  );

  const adminJobsPagePath = path.resolve('app/(admin)/command/jobs/page.tsx');
  const jobsPageContent = fs.readFileSync(adminJobsPagePath, 'utf8');
  assert.ok(
    jobsPageContent.includes("process.env.NODE_ENV !== 'production'"),
    'Seed button must not render in production builds'
  );
});

test('6. Naming: Terminate Admin Session renamed to Sign out', () => {
  const layoutPath = path.resolve('app/(admin)/command/layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(!content.includes('Terminate Admin Session'), 'Terminate Admin Session must not appear anywhere in layout');
  assert.ok(content.includes('<span>Sign out</span>'), 'Must use plain English "Sign out"');
});
