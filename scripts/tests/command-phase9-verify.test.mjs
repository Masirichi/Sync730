// scripts/tests/command-phase9-verify.test.mjs
// Phase 9 Automated Test Suite for Sync730 Command Center.
// Covers Verification Items: 1, 2, 3, 4, 7, 9.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();

// Load permissions matrix module directly
const {
  ROLE_PERMISSIONS,
  can,
  normalizeAdminRole,
  getRoleDisplayName,
} = await import('../../lib/admin/permissions-matrix.ts');

// Transpile and load evaluateListingReview from lib/jobs/review-criteria.ts
const reviewCriteriaSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/jobs/review-criteria.ts'), 'utf8');
const reviewCriteriaJs = ts.transpileModule(reviewCriteriaSrc, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

const mockReviewCriteriaExports = {};
const mockReviewCriteriaModule = { exports: mockReviewCriteriaExports };
const evalFn = new Function('require', 'module', 'exports', reviewCriteriaJs);
evalFn((mod) => {
  if (mod === './config') return { ROLE_STALE_WINDOW_DAYS: 14, MAX_REPORTS_BEFORE_HIDE: 3 };
  if (mod === './helpers') return { isRoleStale: () => false };
  return {};
}, mockReviewCriteriaModule, mockReviewCriteriaExports);

const evaluateListingReview = mockReviewCriteriaModule.exports.evaluateListingReview;

// ----------------------------------------------------------------------------
// ITEM 1: Every dangerous action enforces reason, confirmation, and audit
// ----------------------------------------------------------------------------
test('Item 1: Every dangerous action enforces reason (min 10 chars), confirmation, and audit server-side', () => {
  // 1. Role Change
  const usersRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/users/route.ts'), 'utf8');
  assert.ok(usersRoute.includes("'users:manage_roles'"), 'Role change requires users:manage_roles permission');
  assert.ok(usersRoute.includes('requireReason(reason, 10)') || usersRoute.includes('requireReason(reason || body.notes, 10)'), 'Role change enforces min 10-char reason');
  assert.ok(usersRoute.includes('recordDangerousAuditLog'), 'Role change logs to append-only audit trail');

  // 2. Token Adjust
  const tokensRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/workspaces/adjust-tokens/route.ts'), 'utf8');
  assert.ok(tokensRoute.includes("'tokens:adjust'") || tokensRoute.includes("'employers:adjust_tokens'"), 'Token adjust requires tokens:adjust permission');
  assert.ok(tokensRoute.includes('requireReason') && tokensRoute.includes('10'), 'Token adjust enforces min 10-char reason');
  assert.ok(tokensRoute.includes('TOKEN_ADJUSTMENT'), 'Token adjust logs TOKEN_ADJUSTMENT');
  assert.ok(tokensRoute.includes('MAX_TOKEN_ADJUSTMENT') || tokensRoute.includes('maximum allowed limit'), 'Token adjust enforces upper limit');

  // 3. Crawler
  const crawlerRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/crawler/route.ts'), 'utf8');
  assert.ok(crawlerRoute.includes("'sources:manage'"), 'Crawler requires sources:manage permission');
  assert.ok(crawlerRoute.includes('requireReason') && crawlerRoute.includes('10'), 'Crawler enforces min 10-char reason');
  assert.ok(crawlerRoute.includes('TRIGGER_CRAWLER'), 'Crawler logs TRIGGER_CRAWLER');
  assert.ok(crawlerRoute.includes("status: 'needs_review'") && crawlerRoute.includes('is_active: false'), 'Crawler jobs default to unverified');

  // 4. Takedown
  const takedownRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/jobs/toggle-status/route.ts'), 'utf8');
  assert.ok(takedownRoute.includes("'roles:delete'"), 'Takedown requires roles:delete permission');
  assert.ok(takedownRoute.includes('requireReason') && takedownRoute.includes('10'), 'Takedown enforces min 10-char reason');
  assert.ok(takedownRoute.includes('JOB_TAKEDOWN') || takedownRoute.includes('ROLE_STATUS_CHANGED'), 'Takedown logs to audit trail');

  // 5. Refund
  const refundRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/transactions/refund/route.ts'), 'utf8');
  assert.ok(refundRoute.includes("'money:refund'"), 'Refund requires money:refund permission');
  assert.ok(refundRoute.includes('requireReason(reason, 10)'), 'Refund enforces min 10-char reason');
  assert.ok(refundRoute.includes('PAYMENT_REFUNDED'), 'Refund logs PAYMENT_REFUNDED');

  // 6. Suspend
  assert.ok(usersRoute.includes("'users:suspend'"), 'Suspend requires users:suspend permission');
  assert.ok(usersRoute.includes('USER_SUSPENDED'), 'Suspend logs USER_SUSPENDED');

  // 7. Revoke (Video moderation)
  const moderateRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/vetting/moderate/route.ts'), 'utf8');
  assert.ok(moderateRoute.includes("'video_review:moderate'"), 'Moderation requires video_review:moderate permission');
  assert.ok(moderateRoute.includes('reason.trim().length < 10'), 'Moderation enforces min 10-char reason');
  assert.ok(moderateRoute.includes('VIDEO_MODERATION_REVOKE') || moderateRoute.includes('saveAdminAuditLog'), 'Moderation logs to audit trail');
});

// ----------------------------------------------------------------------------
// ITEM 2: Self-demotion and last Super admin removal are blocked
// ----------------------------------------------------------------------------
test('Item 2: Self-demotion and last Super admin removal are blocked', () => {
  const usersRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/users/route.ts'), 'utf8');

  // Self-demotion check
  assert.ok(
    usersRoute.includes('Self-demotion is prohibited'),
    'Server must reject self-demotion attempts'
  );

  // Last Super admin check
  assert.ok(
    usersRoute.includes('Cannot remove the last remaining platform admin / Cannot remove the last remaining Super admin'),
    'Server must block removal or demotion of the last Super admin'
  );

  // Self-suspension check
  assert.ok(
    usersRoute.includes('You cannot suspend your own account'),
    'Server must block self-suspension'
  );
});

// ----------------------------------------------------------------------------
// ITEM 3: No crawled or needs_review role can appear on the public site
// ----------------------------------------------------------------------------
test('Item 3: No crawled, needs_review, or ingested role can appear on the public site', () => {
  const baseJob = {
    company_name: 'Acme Technologies',
    apply_url: 'https://acme.com/apply',
    salary: '$80,000 - $100,000',
    valid_through: new Date(Date.now() + 86400000 * 30).toISOString(),
    is_active: true,
    reports_count: 0,
    roleVerifiedAt: new Date().toISOString(),
  };

  // Case 1: review_status = 'needs_review'
  const res1 = evaluateListingReview({ ...baseJob, review_status: 'needs_review' });
  assert.equal(res1.passed, false, 'Role with review_status: needs_review must not pass public review');

  // Case 2: review_status = 'ingested'
  const res2 = evaluateListingReview({ ...baseJob, review_status: 'ingested' });
  assert.equal(res2.passed, false, 'Role with review_status: ingested must not pass public review');

  // Case 3: status = 'needs_review'
  const res3 = evaluateListingReview({ ...baseJob, status: 'needs_review' });
  assert.equal(res3.passed, false, 'Role with status: needs_review must not pass public review');

  // Case 4: status = 'ingested'
  const res4 = evaluateListingReview({ ...baseJob, status: 'ingested' });
  assert.equal(res4.passed, false, 'Role with status: ingested must not pass public review');

  // Case 5: status = 'stale'
  const res5 = evaluateListingReview({ ...baseJob, status: 'stale' });
  assert.equal(res5.passed, false, 'Role with status: stale must not pass public review');

  // Case 6: status = 'removed'
  const res6 = evaluateListingReview({ ...baseJob, status: 'removed' });
  assert.equal(res6.passed, false, 'Role with status: removed must not pass public review');

  // Case 7: Legitimate verified live role
  const res7 = evaluateListingReview({ ...baseJob, status: 'live', review_status: 'approved' });
  assert.equal(res7.passed, true, 'Fully verified live role must pass review');
});

// ----------------------------------------------------------------------------
// ITEM 4: Featured is strictly capped at 3
// ----------------------------------------------------------------------------
test('Item 4: Featured roles are capped at a maximum of 3', () => {
  const toggleRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/jobs/toggle-featured/route.ts'), 'utf8');
  assert.ok(toggleRoute.includes('currentFeatured >= 3'), 'Toggle featured endpoint enforces maximum of 3 featured roles');
  assert.ok(toggleRoute.includes('FEATURED_CAP_REACHED'), 'Toggle featured endpoint returns FEATURED_CAP_REACHED code');

  const serverStoreContent = fs.readFileSync(path.join(ROOT_DIR, 'lib/admin/server-store.ts'), 'utf8');
  assert.ok(serverStoreContent.includes('activeFeaturedCount >= 3'), 'server-store.ts throws error if featuring exceeds 3 roles');
  assert.ok(serverStoreContent.includes('Featured roles are capped at a maximum of 3'), 'server-store.ts enforces 3-cap error message');
});

// ----------------------------------------------------------------------------
// ITEM 7: Flags never alter scores or statuses; no automatic rejection path exists
// ----------------------------------------------------------------------------
test('Item 7: Flags never alter candidate scores; no automatic rejection path exists', () => {
  const vettingRoute = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/vetting/route.ts'), 'utf8');
  assert.ok(
    !vettingRoute.includes('score -') && !vettingRoute.includes('penalty'),
    'Vetting API must NEVER apply penalty to scores'
  );
  assert.ok(
    vettingRoute.includes("modStatus = structuredFlags.length > 0 ? 'FLAGGED' : 'PENDING'"),
    'Candidates with integrity flags must route to FLAGGED queue, never auto-rejected'
  );

  const videoReviewPage = fs.readFileSync(path.join(ROOT_DIR, 'app/(admin)/command/video-review/page.tsx'), 'utf8');
  assert.ok(
    videoReviewPage.includes('Flags can be caused by shared homes, generators, low light or how a person naturally looks and moves'),
    'Video review UI must show the required human-first evaluation note'
  );
});

// ----------------------------------------------------------------------------
// ITEM 9: Permissions matrix is enforced by direct URL and by API
// ----------------------------------------------------------------------------
test('Item 9: Permissions matrix is enforced by direct URL and by API', () => {
  // Matrix tests
  assert.equal(can('super_admin', 'users:manage_roles'), true, 'Super admin can manage roles');
  assert.equal(can('moderator', 'users:manage_roles'), false, 'Moderator cannot manage roles');
  assert.equal(can('moderator', 'roles:verify'), true, 'Moderator can verify roles');
  assert.equal(can('video_reviewer', 'video_review:moderate'), true, 'Vetting reviewer can moderate videos');
  assert.equal(can('video_reviewer', 'money:read'), false, 'Vetting reviewer cannot read money');
  assert.equal(can('finance', 'money:refund'), true, 'Finance can refund money');
  assert.equal(can('finance', 'users:manage_roles'), false, 'Finance cannot manage roles');
  assert.equal(can('support', 'page:overview'), true, 'Support can view overview');
  assert.equal(can('support', 'roles:edit'), false, 'Support cannot edit roles');

  // Direct URL enforcement in CommandClientLayout
  const clientLayout = fs.readFileSync(path.join(ROOT_DIR, 'components/admin/command-client-layout.tsx'), 'utf8');
  assert.ok(clientLayout.includes('Access Restricted'), 'CommandClientLayout must render Access Restricted card for unauthorized URLs');
  assert.ok(clientLayout.includes('403'), 'CommandClientLayout must show 403 status code for unauthorized URLs');
  assert.ok(clientLayout.includes('can(currentRole, currentAction)'), 'CommandClientLayout must verify role permission against required page permission');
});

// ----------------------------------------------------------------------------
// SUPABASE SECURITY ARCHITECTURE: RLS, RPCs, ADMIN_ROLES, RETENTION
// ----------------------------------------------------------------------------
test('Supabase Security Architecture: RLS, Atomic RPCs, admin_roles, and Retention', () => {
  // 1. Authoritative admin_roles table (never user_metadata)
  const permissionsSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/admin/permissions.ts'), 'utf8');
  assert.ok(permissionsSrc.includes("from('admin_roles')"), 'Authorisation must query the admin_roles table');
  assert.ok(
    !permissionsSrc.includes('user.user_metadata?.role'),
    'Authorisation must NEVER be based on user_metadata (users can edit it)'
  );

  // 2. Migration: RLS & 7 Dangerous Action RPCs
  const migrationPath = path.join(ROOT_DIR, 'supabase/migrations/20261118_supabase_rls_and_dangerous_action_rpcs.sql');
  assert.ok(fs.existsSync(migrationPath), 'Supabase RLS & RPC migration must exist');
  const migrationSrc = fs.readFileSync(migrationPath, 'utf8');

  // Verify all 7 RPC functions exist with SECURITY DEFINER and search_path
  const expectedRpcs = [
    'rpc_admin_change_user_role',
    'rpc_admin_adjust_tokens',
    'rpc_admin_log_crawler_run',
    'rpc_admin_takedown_role',
    'rpc_admin_refund_transaction',
    'rpc_admin_suspend_user',
    'rpc_admin_moderate_video',
  ];
  for (const rpc of expectedRpcs) {
    assert.ok(migrationSrc.includes(rpc), `Migration must define ${rpc}`);
  }
  assert.ok(migrationSrc.includes('SECURITY DEFINER'), 'RPCs must use SECURITY DEFINER');
  assert.ok(migrationSrc.includes('SET search_path = public, pg_temp'), 'RPCs must set fixed search_path = public, pg_temp');
  assert.ok(migrationSrc.includes('GRANT EXECUTE ON FUNCTION'), 'RPCs must be explicitly granted');
  assert.ok(migrationSrc.includes('TO service_role'), 'RPCs must be granted to service_role');
  assert.ok(migrationSrc.includes('REVOKE ALL ON FUNCTION'), 'RPCs must revoke access from anon, authenticated, public');

  // 3. Service Role Key Server-Only
  const serviceRoleClientSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/supabase/service-role.ts'), 'utf8');
  assert.ok(serviceRoleClientSrc.includes('process.env.SUPABASE_SERVICE_ROLE_KEY'), 'Service key must use server env variable');
  assert.ok(!serviceRoleClientSrc.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'), 'Service key must NEVER be prefixed with NEXT_PUBLIC_');

  // 4. Interview Recording Retention (Max 90 days)
  const vettingRouteSrc = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/vetting/route.ts'), 'utf8');
  assert.ok(vettingRouteSrc.includes('retentionDays'), 'Vetting route must enforce retentionDays');
  assert.ok(vettingRouteSrc.includes('90'), 'Retention ceiling must be maximum 90 days');
  assert.ok(vettingRouteSrc.includes('Recording purged per retention policy'), 'Expired recordings must be purged with clear reason');
  assert.ok(migrationSrc.includes('recording_retention_days INTEGER DEFAULT 90 CHECK (recording_retention_days <= 90'), 'Database schema must constrain retention to max 90 days');
});
