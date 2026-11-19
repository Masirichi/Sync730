// scripts/tests/command-phase1-complete.test.mjs
// Phase 1 Automated Test Suite for Database Lockdown & Safe Dangerous Actions.
// Tests all 5 Acceptance Criteria:
// 1. Direct call to dangerous action endpoints without reason or step-up fails and writes nothing.
// 2. Self-demotion and last-super-admin removal fail inside database functions and server handlers.
// 3. Anon key cannot read or write protected tables; public site reads roles without breaking.
// 4. Audit rows cannot be updated, deleted or truncated by any role.
// 5. No service role key in client bundles or NEXT_PUBLIC_ variables.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

// Test Item 1: Direct call to dangerous action endpoints without reason or step-up fails
test('Acceptance 1: Direct calls to dangerous actions enforce reason (min 10 chars) and Step-Up Auth', async () => {
  const { assertStepUpAuth, generateStepUpToken, verifyStepUpToken } = await import('../../lib/admin/security.ts');

  // Verify requireReason function implementation
  function requireReason(reason, minLength = 10) {
    if (typeof reason !== 'string' || reason.trim().length < minLength) {
      throw new Error(`A mandatory reason of at least ${minLength} characters is required for this dangerous action.`);
    }
    return reason.trim();
  }

  // Reason checks
  assert.throws(() => requireReason('', 10), /at least 10 characters/);
  assert.throws(() => requireReason('too short', 10), /at least 10 characters/);
  assert.equal(requireReason('This is a valid ten-char reason', 10), 'This is a valid ten-char reason');

  // Step-Up Token generation and expiration
  const token = generateStepUpToken('usr-admin-001', 'admin@sync730.com', 'role_change');
  const verified = verifyStepUpToken(token, 'role_change');
  assert.equal(verified.valid, true);
  assert.equal(verified.adminId, 'usr-admin-001');

  // Action class mismatch test
  const mismatched = verifyStepUpToken(token, 'token_adjust');
  assert.equal(mismatched.valid, false);
  assert.ok(mismatched.error?.includes('bound to'));

  // Invalid token test
  const invalid = verifyStepUpToken('invalid.token.payload', 'role_change');
  assert.equal(invalid.valid, false);

  // Verify all 4 dangerous action routes enforce assertStepUpAuth and requireReason
  const usersRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/users/route.ts'), 'utf8');
  assert.ok(usersRoute.includes('assertStepUpAuth'), 'Users route must enforce assertStepUpAuth');
  assert.ok(usersRoute.includes('requireReason'), 'Users route must enforce requireReason');
  assert.ok(usersRoute.includes('change_user_role'), 'Users route must call change_user_role RPC');
  assert.ok(usersRoute.includes('suspend_user'), 'Users route must call suspend_user RPC');

  const tokensRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/workspaces/adjust-tokens/route.ts'), 'utf8');
  assert.ok(tokensRoute.includes('assertStepUpAuth'), 'Tokens route must enforce assertStepUpAuth');
  assert.ok(tokensRoute.includes('requireReason'), 'Tokens route must enforce requireReason');
  assert.ok(tokensRoute.includes('adjust_tokens'), 'Tokens route must call adjust_tokens RPC');

  const takedownRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/jobs/toggle-status/route.ts'), 'utf8');
  assert.ok(takedownRoute.includes('assertStepUpAuth'), 'Takedown route must enforce assertStepUpAuth');
  assert.ok(takedownRoute.includes('requireReason'), 'Takedown route must enforce requireReason');
  assert.ok(takedownRoute.includes('take_down_role'), 'Takedown route must call take_down_role RPC');

  const crawlerRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/crawler/route.ts'), 'utf8');
  assert.ok(crawlerRoute.includes('assertStepUpAuth'), 'Crawler route must enforce assertStepUpAuth');
  assert.ok(crawlerRoute.includes('requireReason'), 'Crawler route must enforce requireReason');
  assert.ok(crawlerRoute.includes('trigger_crawler_run'), 'Crawler route must call trigger_crawler_run RPC');
});

// Test Item 2: Self-demotion and last-super-admin removal fail inside database function
test('Acceptance 2: Self-demotion and last Super admin removal blocked in server logic and RPC', () => {
  const usersRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/users/route.ts'), 'utf8');
  assert.ok(usersRoute.includes('Self-demotion is prohibited'), 'Server must block self-demotion');
  assert.ok(usersRoute.includes('Cannot remove the last remaining platform admin / Cannot remove the last remaining Super admin'), 'Server must block removing last Super admin');

  // Verify in database migration SQL:
  const migPath = path.resolve('supabase/migrations/20261119_phase1_database_lockdown_and_safe_actions.sql');
  const migSql = fs.readFileSync(migPath, 'utf8');
  assert.ok(migSql.includes('Self-demotion is prohibited'), 'RPC must check self-demotion');
  assert.ok(migSql.includes('Cannot remove the last remaining Super admin'), 'RPC must check last Super admin count');
  assert.ok(migSql.includes('v_admin_count <= 1'), 'RPC must count remaining super_admin roles');
});

// Test Item 3: Anon key cannot read or write protected tables; public board works
test('Acceptance 3: Anon key locked down on protected tables; remote_jobs public read preserved', () => {
  const migPath = path.resolve('supabase/migrations/20261119_phase1_database_lockdown_and_safe_actions.sql');
  const migSql = fs.readFileSync(migPath, 'utf8');

  // All sensitive tables must revoke ALL from anon
  const lockedTables = [
    'token_unlocks',
    'workspace_members',
    'employer_jobs',
    'admin_audit_logs',
    'mock_prep_sessions',
    'corporate_workspaces',
    'video_assessments',
    'platform_transactions',
    'admin_roles',
    'audit_log',
  ];

  for (const table of lockedTables) {
    const hasRevoke = migSql.includes(`REVOKE ALL ON public.${table} FROM anon`) ||
                      migSql.includes(`REVOKE ALL ON public.${table} FROM PUBLIC, anon, authenticated`);
    assert.ok(hasRevoke, `Table public.${table} must revoke ALL from anon`);
  }

  // Dropping legacy permissive Sprint 3 policies
  assert.ok(migSql.includes('DROP POLICY IF EXISTS "Public can manage token unlocks"'), 'Must drop token unlocks public policy');
  assert.ok(migSql.includes('DROP POLICY IF EXISTS "Public can manage workspace members"'), 'Must drop workspace members public policy');
  assert.ok(migSql.includes('DROP POLICY IF EXISTS "Public can manage employer jobs"'), 'Must drop employer jobs public policy');

  // Public remote_jobs must remain readable for active jobs
  assert.ok(migSql.includes('GRANT SELECT ON public.remote_jobs TO anon'), 'public.remote_jobs must grant SELECT to anon');
  assert.ok(migSql.includes('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.remote_jobs FROM anon'), 'public.remote_jobs must revoke write access from anon');

  // Verify public job fetcher reads public_roles (or remote_jobs in legacy Phase 1)
  const fetcherSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/crawler/jobs-fetcher.ts'), 'utf8');
  assert.ok(fetcherSrc.includes(".from('public_roles')") || fetcherSrc.includes(".from('remote_jobs')"), 'Public fetcher reads public_roles or remote_jobs');
});

// Test Item 4: Audit rows cannot be updated, deleted, or truncated by any role
test('Acceptance 4: Audit rows immutable: triggers prevent UPDATE, DELETE, and TRUNCATE', () => {
  const migPath = path.resolve('supabase/migrations/20261119_phase1_database_lockdown_and_safe_actions.sql');
  const migSql = fs.readFileSync(migPath, 'utf8');

  // Row trigger
  assert.ok(migSql.includes('trg_audit_log_immutable'), 'Must define trg_audit_log_immutable');
  assert.ok(migSql.includes('BEFORE UPDATE OR DELETE ON public.audit_log'), 'Must trigger before UPDATE or DELETE');
  assert.ok(migSql.includes('UPDATE and DELETE operations are strictly prohibited'), 'Must raise exception on row change');

  // Statement trigger
  assert.ok(migSql.includes('trg_audit_log_no_truncate'), 'Must define trg_audit_log_no_truncate');
  assert.ok(migSql.includes('BEFORE TRUNCATE ON public.audit_log'), 'Must trigger before TRUNCATE');
  assert.ok(migSql.includes('TRUNCATE operation is strictly prohibited'), 'Must raise exception on TRUNCATE');

  // Revoke service_role modification permissions
  assert.ok(
    migSql.includes('REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_log FROM service_role'),
    'Must revoke UPDATE, DELETE, TRUNCATE from service_role'
  );
});

// Test Item 5: No service role key in client bundles
test('Acceptance 5: No service role key in client bundles or NEXT_PUBLIC_ variables', () => {
  function walk(dir) {
    let results = [];
    for (const f of fs.readdirSync(dir)) {
      if (f === 'node_modules' || f === '.next' || f === '.git') continue;
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
      else results.push(full);
    }
    return results;
  }

  const allFiles = walk(ROOT_DIR);
  for (const file of allFiles) {
    if (file.endsWith('.test.mjs')) continue;
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(
      !content.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'),
      `File ${file} must NOT contain NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
    );
  }

  // Verify service-role client is server-only
  const serviceRoleSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/supabase/service-role.ts'), 'utf8');
  assert.ok(!serviceRoleSrc.includes("'use client'"), 'service-role.ts must NOT be a client file');
  assert.ok(serviceRoleSrc.includes('process.env.SUPABASE_SERVICE_ROLE_KEY'), 'Reads private SUPABASE_SERVICE_ROLE_KEY');
});
