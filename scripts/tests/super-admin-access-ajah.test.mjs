// scripts/tests/super-admin-access-ajah.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

// Emoji detector regex
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

test('1. Verify Ajah Malachy Super Admin User in Admin Store', () => {
  const storePath = path.join(ROOT_DIR, 'lib/admin/store.ts');
  const storeContent = fs.readFileSync(storePath, 'utf8');

  // Verify email and super_admin role are present in SEED_ADMIN_USERS
  assert.ok(
    storeContent.includes('ajahmalachy@gmail.com'),
    'SEED_ADMIN_USERS must include ajahmalachy@gmail.com'
  );
  assert.ok(
    storeContent.includes("full_name: 'Ajah Malachy'"),
    'SEED_ADMIN_USERS must include Ajah Malachy full name'
  );
  assert.ok(
    storeContent.includes("role: 'super_admin'"),
    'User must have super_admin role'
  );
  assert.ok(
    storeContent.includes("status: 'ACTIVE'"),
    'Super Admin status must be ACTIVE'
  );
  assert.ok(
    storeContent.includes('mfa_enabled: true'),
    'MFA must be marked enabled to avoid forced setup blocking during live feature testing'
  );

  // Verify getAdminUsers preservation logic
  assert.ok(
    storeContent.includes("u.email?.toLowerCase() === 'ajahmalachy@gmail.com'"),
    'getAdminUsers must ensure Ajah Malachy Super Admin is preserved regardless of localStorage state'
  );
});

test('2. Verify Permissions & Actor Resolution for Super Admin', () => {
  const permissionsPath = path.join(ROOT_DIR, 'lib/admin/permissions.ts');
  const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

  assert.ok(
    permissionsContent.includes('ajahmalachy@gmail.com'),
    'resolveAdminActor must configure ajahmalachy@gmail.com as primary Super Admin actor'
  );
  assert.ok(
    permissionsContent.includes("actorName = 'Ajah Malachy'"),
    'resolveAdminActor must resolve actorName to Ajah Malachy'
  );
  assert.ok(
    permissionsContent.includes("actorId = 'usr-admin-super-ajah'"),
    'resolveAdminActor must assign unique super admin actor ID'
  );
  assert.ok(
    permissionsContent.includes("rawRole = 'super_admin'"),
    'resolveAdminActor must default role to super_admin'
  );

  // Check Permissions Matrix
  const matrixPath = path.join(ROOT_DIR, 'lib/admin/permissions-matrix.ts');
  const matrixContent = fs.readFileSync(matrixPath, 'utf8');

  assert.ok(
    matrixContent.includes('super_admin: ['),
    'Permissions matrix must define super_admin role array'
  );
  assert.ok(
    matrixContent.includes("'impersonate'"),
    'super_admin must have impersonate permission'
  );
  assert.ok(
    matrixContent.includes("'employers:adjust_tokens'"),
    'super_admin must have employers:adjust_tokens permission'
  );
  assert.ok(
    matrixContent.includes("'roles:delete'"),
    'super_admin must have roles:delete permission'
  );
});

test('3. Verify Middleware & Recruiter Session Authorization', () => {
  const middlewarePath = path.join(ROOT_DIR, 'lib/supabase/middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

  assert.ok(
    middlewareContent.includes('ajahmalachy@gmail.com'),
    'Middleware must explicitly recognize ajahmalachy@gmail.com'
  );
  assert.ok(
    middlewareContent.includes("PLATFORM_ADMIN"),
    'Middleware must assign PLATFORM_ADMIN role'
  );

  const recruiterAuthPath = path.join(ROOT_DIR, 'lib/recruiter/auth.ts');
  const recruiterAuthContent = fs.readFileSync(recruiterAuthPath, 'utf8');

  assert.ok(
    recruiterAuthContent.includes('ajahmalachy@gmail.com'),
    'Recruiter auth must recognize ajahmalachy@gmail.com'
  );
  assert.ok(
    recruiterAuthContent.includes("isPlatformAdmin: true"),
    'Recruiter session must mark isPlatformAdmin as true'
  );
  assert.ok(
    recruiterAuthContent.includes("role: 'OWNER'"),
    'Recruiter session must grant OWNER role for full workspace test access'
  );
});

test('4. Verify Command Client Layout & Login Provisioning', () => {
  const layoutPath = path.join(ROOT_DIR, 'components/admin/command-client-layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(
    layoutContent.includes("super_admin: { name: 'Ajah Malachy', email: 'ajahmalachy@gmail.com' }"),
    'Command layout ROLE_USERS must associate super_admin persona with Ajah Malachy'
  );

  const loginPath = path.join(ROOT_DIR, 'app/(auth)/login/page.tsx');
  const loginContent = fs.readFileSync(loginPath, 'utf8');

  assert.ok(
    loginContent.includes('ajahmalachy@gmail.com'),
    'Login page must support ajahmalachy@gmail.com bypass and instant sign in'
  );
  assert.ok(
    loginContent.includes('/api/auth/demo-login?role=super_admin&email=ajahmalachy@gmail.com'),
    'Login page must offer instant Super Admin Sign In for Ajah Malachy'
  );

  const headerPath = path.join(ROOT_DIR, 'components/site/site-header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  assert.ok(
    headerContent.includes('ajahmalachy@gmail.com'),
    'Site header must recognize ajahmalachy@gmail.com'
  );
  assert.ok(
    headerContent.includes('/command/metrics'),
    'Site header must expose Admin Command Center link for Super Admin'
  );
});

test('5. Zero Emojis Compliance in all Super Admin touched files', () => {
  const filesToCheck = [
    'lib/admin/store.ts',
    'lib/admin/permissions.ts',
    'lib/supabase/middleware.ts',
    'lib/recruiter/auth.ts',
    'components/admin/command-client-layout.tsx',
    'app/(auth)/login/page.tsx',
    'app/api/auth/demo-login/route.ts',
    'components/site/site-header.tsx',
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(
      !EMOJI_REGEX.test(content),
      `File ${relPath} must not contain any unicode emojis.`
    );
  }
});
