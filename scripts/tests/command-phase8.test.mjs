import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Import permission functions and types directly from source files
const ROOT_DIR = process.cwd();

// Helper imports
const permissionsFile = fs.readFileSync(path.join(ROOT_DIR, 'lib/admin/permissions.ts'), 'utf8');
const mfaFile = fs.readFileSync(path.join(ROOT_DIR, 'lib/admin/mfa.ts'), 'utf8');
const middlewareFile = fs.readFileSync(path.join(ROOT_DIR, 'middleware.ts'), 'utf8');
const usersRouteFile = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/users/route.ts'), 'utf8');
const viewAsRouteFile = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/view-as/route.ts'), 'utf8');
const vettingRouteFile = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/vetting/route.ts'), 'utf8');
const transactionsRouteFile = fs.readFileSync(path.join(ROOT_DIR, 'app/api/admin/transactions/route.ts'), 'utf8');

// Dynamic module evaluation for pure logic tests
const {
  ROLE_PERMISSIONS,
  can,
  normalizeAdminRole,
  getRoleDisplayName,
} = await import('../../lib/admin/permissions-matrix.ts');

const {
  requiresMfa,
  generateBase32Secret,
  generateRecoveryCodes,
  computeTotp,
  verifyTotp,
  calculateMfaGraceDays,
} = await import('../../lib/admin/mfa.ts');

test('Phase 8: Scoped Role-Permission Matrix matches specifications exactly', () => {
  // 1. Super admin: Everything
  assert.ok(can('super_admin', 'page:overview'));
  assert.ok(can('super_admin', 'page:roles'));
  assert.ok(can('super_admin', 'page:video_review'));
  assert.ok(can('super_admin', 'page:money'));
  assert.ok(can('super_admin', 'users:manage_roles'));
  assert.ok(can('super_admin', 'roles:verify'));
  assert.ok(can('super_admin', 'money:refund'));
  assert.ok(can('super_admin', 'impersonate'));

  // 2. Moderator: Roles, Reports, Sources ONLY
  assert.ok(can('moderator', 'page:overview'));
  assert.ok(can('moderator', 'page:roles'));
  assert.ok(can('moderator', 'page:reports'));
  assert.ok(can('moderator', 'page:sources'));
  assert.ok(can('moderator', 'roles:verify'));
  assert.ok(can('moderator', 'reports:resolve'));

  // Moderator blocked from Money, Video review, Users, Settings, Impersonation
  assert.equal(can('moderator', 'page:money'), false, 'Moderator cannot access Money page');
  assert.equal(can('moderator', 'money:read'), false, 'Moderator cannot read Money');
  assert.equal(can('moderator', 'money:refund'), false, 'Moderator cannot refund');
  assert.equal(can('moderator', 'page:video_review'), false, 'Moderator cannot access Video review page');
  assert.equal(can('moderator', 'video_review:read'), false, 'Moderator cannot read Video review');
  assert.equal(can('moderator', 'page:users'), false, 'Moderator cannot access Users page');
  assert.equal(can('moderator', 'users:manage_roles'), false, 'Moderator cannot manage roles');
  assert.equal(can('moderator', 'page:settings'), false, 'Moderator cannot access Settings page');
  assert.equal(can('moderator', 'impersonate'), false, 'Moderator cannot impersonate / View As');

  // 3. Vetting reviewer: Video review ONLY
  assert.ok(can('vetting_reviewer', 'page:overview'));
  assert.ok(can('vetting_reviewer', 'page:video_review'));
  assert.ok(can('vetting_reviewer', 'video_review:read'));
  assert.ok(can('vetting_reviewer', 'video_review:moderate'));

  // Vetting reviewer blocked from Roles, Reports, Users, Employers, Money, Settings
  assert.equal(can('vetting_reviewer', 'page:roles'), false);
  assert.equal(can('vetting_reviewer', 'page:reports'), false);
  assert.equal(can('vetting_reviewer', 'page:money'), false);
  assert.equal(can('vetting_reviewer', 'page:users'), false);
  assert.equal(can('vetting_reviewer', 'users:manage_roles'), false);
  assert.equal(can('vetting_reviewer', 'impersonate'), false);

  // 4. Finance: Tokens, Payments (read, refund, export) and Employers (read)
  assert.ok(can('finance', 'page:overview'));
  assert.ok(can('finance', 'page:money'));
  assert.ok(can('finance', 'money:read'));
  assert.ok(can('finance', 'money:refund'));
  assert.ok(can('finance', 'money:export'));
  assert.ok(can('finance', 'page:employers'));
  assert.ok(can('finance', 'employers:read'));

  // Finance blocked from role changes, role verification, video review, adjusting tokens
  assert.equal(can('finance', 'users:manage_roles'), false, 'Finance cannot change roles');
  assert.equal(can('finance', 'employers:adjust_tokens'), false, 'Finance cannot adjust tokens');
  assert.equal(can('finance', 'roles:verify'), false);
  assert.equal(can('finance', 'video_review:read'), false);
  assert.equal(can('finance', 'impersonate'), false);

  // 5. Support: Read-only on Users, Employers, Roles, Reports; plus Impersonate
  assert.ok(can('support', 'page:overview'));
  assert.ok(can('support', 'page:users'));
  assert.ok(can('support', 'users:read'));
  assert.ok(can('support', 'page:employers'));
  assert.ok(can('support', 'employers:read'));
  assert.ok(can('support', 'page:roles'));
  assert.ok(can('support', 'roles:read'));
  assert.ok(can('support', 'page:reports'));
  assert.ok(can('support', 'reports:read'));
  assert.ok(can('support', 'impersonate'), 'Support can use View As impersonation');

  // Support blocked from all mutations
  assert.equal(can('support', 'users:manage_roles'), false, 'Support cannot manage roles');
  assert.equal(can('support', 'roles:verify'), false, 'Support cannot verify roles');
  assert.equal(can('support', 'roles:edit'), false, 'Support cannot edit roles');
  assert.equal(can('support', 'money:refund'), false, 'Support cannot refund');
  assert.equal(can('support', 'video_review:moderate'), false, 'Support cannot moderate videos');
  assert.equal(can('support', 'employers:adjust_tokens'), false, 'Support cannot adjust tokens');
});

test('Phase 8: Plain text role display names (no enums in UI)', () => {
  assert.equal(getRoleDisplayName('super_admin'), 'Super admin');
  assert.equal(getRoleDisplayName('PLATFORM_ADMIN'), 'Super admin');
  assert.equal(getRoleDisplayName('admin'), 'Super admin');
  assert.equal(getRoleDisplayName('moderator'), 'Moderator');
  assert.equal(getRoleDisplayName('vetting_reviewer'), 'Vetting reviewer');
  assert.equal(getRoleDisplayName('finance'), 'Finance');
  assert.equal(getRoleDisplayName('support'), 'Support');
  assert.equal(getRoleDisplayName('recruiter'), 'Recruiter');
  assert.equal(getRoleDisplayName('candidate'), 'Candidate');
});

test('Phase 8: Server-side route handlers enforce permissions and log 403 violations', () => {
  // Check vetting route enforces video_review:read
  assert.ok(
    vettingRouteFile.includes("assertServerPermission(req, 'video_review:read')"),
    'Vetting GET must assert video_review:read'
  );

  // Check transactions route enforces money:read
  assert.ok(
    transactionsRouteFile.includes("assertServerPermission(req, 'money:read')"),
    'Transactions GET must assert money:read'
  );

  // Check users route enforces users:read and users:manage_roles
  assert.ok(
    usersRouteFile.includes("assertServerPermission(req, 'users:read')"),
    'Users GET must assert users:read'
  );
  assert.ok(
    usersRouteFile.includes("assertServerPermission(req, 'users:manage_roles')"),
    'Users POST must assert users:manage_roles'
  );

  // Verify unauthorized access attempts write to dangerous audit log
  assert.ok(
    permissionsFile.includes("action: 'UNAUTHORIZED_ACCESS_BLOCKED'"),
    'Permissions assertion must log UNAUTHORIZED_ACCESS_BLOCKED to audit trail'
  );

  // Verify last Super admin cannot be removed
  assert.ok(
    usersRouteFile.includes('Cannot remove the last remaining Super admin'),
    'Server must block removing the last remaining Super admin'
  );
  assert.ok(
    usersRouteFile.includes('superAdminCount <= 1'),
    'Server must count remaining Super admins before allowing demotion'
  );
});

test('Phase 8: View-As Read-Only enforcement and audit logging', () => {
  // Verify View-As API route requires impersonate permission
  assert.ok(
    viewAsRouteFile.includes("assertServerPermission(req, 'impersonate')"),
    'View-As START must assert impersonate permission'
  );

  // Verify START and STOP write audit log entries
  assert.ok(
    viewAsRouteFile.includes("action: 'VIEW_AS_STARTED'"),
    'Must log VIEW_AS_STARTED audit entry'
  );
  assert.ok(
    viewAsRouteFile.includes("action: 'VIEW_AS_STOPPED'"),
    'Must log VIEW_AS_STOPPED audit entry'
  );

  // Verify middleware blocks any write operations while sync730_view_as is active
  assert.ok(
    middlewareFile.includes("request.cookies.get('sync730_view_as')"),
    'Middleware must inspect sync730_view_as cookie'
  );
  assert.ok(
    middlewareFile.includes("['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)"),
    'Middleware must intercept all HTTP write methods'
  );
  assert.ok(
    middlewareFile.includes('VIEW_AS_READ_ONLY'),
    'Middleware must return VIEW_AS_READ_ONLY error code on prohibited writes'
  );
});

test('Phase 8: Multi-Factor Authentication (TOTP) and Emergency Recovery Codes', () => {
  // 1. Roles requiring MFA: Super admin and Finance
  assert.equal(requiresMfa('super_admin'), true);
  assert.equal(requiresMfa('PLATFORM_ADMIN'), true);
  assert.equal(requiresMfa('finance'), true);
  assert.equal(requiresMfa('moderator'), false);
  assert.equal(requiresMfa('vetting_reviewer'), false);
  assert.equal(requiresMfa('support'), false);

  // 2. Base32 secret generation
  const secret = generateBase32Secret(20);
  assert.ok(secret.length >= 20, 'Secret key must be at least 20 chars');
  assert.match(secret, /^[A-Z2-7]+$/, 'Secret must be RFC 4648 Base32');

  // 3. Recovery codes generation (8 secure codes)
  const recoveryCodes = generateRecoveryCodes(8);
  assert.equal(recoveryCodes.length, 8, 'Must generate exactly 8 recovery codes');
  assert.match(recoveryCodes[0], /^SYNC-[0-9A-F]{4}-[0-9A-F]{4}$/, 'Recovery code format must be SYNC-XXXX-XXXX');

  // 4. TOTP computation and verification
  const currentStep = Math.floor(Date.now() / 1000 / 30);
  const otp = computeTotp(secret, currentStep);
  assert.match(otp, /^\d{6}$/, 'TOTP must be 6 digits');

  // Verify valid TOTP
  const verifyResult = verifyTotp(otp, secret, recoveryCodes);
  assert.equal(verifyResult.valid, true, 'Current TOTP token must verify as valid');

  // Verify invalid TOTP is rejected
  const invalidResult = verifyTotp('999999', secret, recoveryCodes);
  assert.equal(invalidResult.valid, false, 'Arbitrary incorrect token must be rejected');

  // Verify recovery code succeeds
  const recoveryResult = verifyTotp(recoveryCodes[0], secret, recoveryCodes);
  assert.equal(recoveryResult.valid, true, 'Emergency recovery code must verify as valid');
  assert.equal(recoveryResult.usedRecoveryCode, recoveryCodes[0]);

  // 5. Grace period calculation
  const joinedNow = new Date().toISOString();
  const graceNow = calculateMfaGraceDays(joinedNow, 14);
  assert.equal(graceNow.isExpired, false, 'New user grace period must not be expired');
  assert.ok(graceNow.daysRemaining >= 13 && graceNow.daysRemaining <= 14, 'Must report ~14 days remaining');

  const joinedPast = new Date(Date.now() - 3600000 * 24 * 20).toISOString();
  const gracePast = calculateMfaGraceDays(joinedPast, 14);
  assert.equal(gracePast.isExpired, true, 'User past 14 days grace period must be expired');
  assert.equal(gracePast.daysRemaining, 0);
});
