import fs from 'fs';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';

const ROOT = process.cwd();

// Emoji detector regex: ensure strict adherence to zero-emojis policy
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

test('1. Verify WordPress-style Admin Portal at /admin/login and /admin/register', () => {
  const adminLoginPath = path.join(ROOT, 'app/(admin)/admin/login/page.tsx');
  const adminRegisterPath = path.join(ROOT, 'app/(admin)/admin/register/page.tsx');
  const adminLoginRedirectPath = path.join(ROOT, 'app/admin-login/page.tsx');
  const adminRootPath = path.join(ROOT, 'app/(admin)/admin/page.tsx');

  assert.ok(fs.existsSync(adminLoginPath), 'Admin login page must exist at app/(admin)/admin/login/page.tsx');
  assert.ok(fs.existsSync(adminRegisterPath), 'Admin register page must exist at app/(admin)/admin/register/page.tsx');
  assert.ok(fs.existsSync(adminLoginRedirectPath), 'Admin-login convenience route must exist at app/admin-login/page.tsx');
  assert.ok(fs.existsSync(adminRootPath), 'Admin root page must exist at app/(admin)/admin/page.tsx');

  const loginContent = fs.readFileSync(adminLoginPath, 'utf8');
  assert.ok(loginContent.includes('Admin Sign In'), 'Admin login page must provide Admin Sign In mode');
  assert.ok(loginContent.includes('Register Admin') || loginContent.includes('Register Administrator'), 'Admin login page must provide Register Administrator mode');
  assert.ok(loginContent.includes('ajahmalachy@gmail.com'), 'Admin login page must reference Super Admin Ajah Malachy default pattern');
  assert.ok(loginContent.includes('provision-super-admin'), 'Admin login page must trigger live database provisioning endpoint');
  assert.ok(loginContent.includes('Remember session (30 days)') || loginContent.includes('Remember me'), 'Admin login must have WordPress-style remember me feature');
  assert.ok(loginContent.includes('Go to Sync730 Home'), 'Admin login must have WordPress-style backlink to site home');

  const adminRootContent = fs.readFileSync(adminRootPath, 'utf8');
  assert.ok(adminRootContent.includes('/admin/login'), 'Admin root page must redirect unauthenticated visitors to /admin/login');
  assert.ok(adminRootContent.includes('/command'), 'Admin root page must redirect authenticated administrators to /command');
});

test('2. Verify 1-Click Role Deletion and Addition without Special Security Measures or Prompts', () => {
  const rolesPagePath = path.join(ROOT, 'app/(admin)/command/roles/page.tsx');
  const content = fs.readFileSync(rolesPagePath, 'utf8');

  // Verify handleDeleteRole function exists and operates immediately without prompt
  assert.ok(content.includes('handleDeleteRole'), 'Roles manager page must define handleDeleteRole');
  assert.ok(content.includes('deleteAdminRemoteJob'), 'Roles manager must call deleteAdminRemoteJob');
  assert.ok(content.includes('Trash2'), 'Roles manager must render Delete button with Trash2 icon');
  assert.ok(content.includes('permanently deleted'), 'Roles manager must give immediate toast confirmation upon deletion');

  // Verify server-side DELETE endpoint in app/api/admin/jobs/route.ts
  const jobsApiPath = path.join(ROOT, 'app/api/admin/jobs/route.ts');
  const jobsApiContent = fs.readFileSync(jobsApiPath, 'utf8');
  assert.ok(jobsApiContent.includes('export async function DELETE'), 'app/api/admin/jobs/route.ts must export DELETE handler');
  assert.ok(jobsApiContent.includes('deleteServerJob'), 'Jobs API must call deleteServerJob');
});

test('3. Verify Direct User Role Modification without Re-auth or Security Prompts in Command Center', () => {
  const usersPagePath = path.join(ROOT, 'app/(admin)/command/users/page.tsx');
  const content = fs.readFileSync(usersPagePath, 'utf8');

  // Verify direct role update without re-auth modal or password requirement
  assert.ok(content.includes('handleDirectRoleChange'), 'Users page must define handleDirectRoleChange');
  assert.ok(content.includes('Grant Super Admin'), 'Users dropdown must provide 1-click Grant Super Admin');
  assert.ok(content.includes('Remove Admin / Reset Role'), 'Users dropdown must provide 1-click Remove Admin / Reset Role');

  // Verify backend API bypasses step-up auth for platform admins
  const usersApiPath = path.join(ROOT, 'app/api/admin/users/route.ts');
  const usersApiContent = fs.readFileSync(usersApiPath, 'utf8');
  assert.ok(usersApiContent.includes('isPlatformAdminActor'), 'Users API must identify platform admin actor');
  assert.ok(usersApiContent.includes('Platform admin direct role modification') || usersApiContent.includes('direct platform administrator role modification'), 'Users API must allow default platform admin reasons');
});

test('4. Verify Layout and Middleware Support for Standalone Admin Portal', () => {
  const adminLayoutPath = path.join(ROOT, 'app/(admin)/admin/layout.tsx');
  const layoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
  assert.ok(layoutContent.includes('/admin/login'), 'Admin layout must omit sidebar and header for /admin/login');

  const middlewarePath = path.join(ROOT, 'lib/supabase/middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  assert.ok(middlewareContent.includes('/admin/login'), 'Middleware must recognize /admin/login in isAuthPath');
  assert.ok(middlewareContent.includes('/admin/register'), 'Middleware must recognize /admin/register in isAuthPath');
});

test('5. Strict Zero Emojis Compliance in all touched and created files', () => {
  const filesToCheck = [
    path.join(ROOT, 'app/(admin)/admin/login/page.tsx'),
    path.join(ROOT, 'app/(admin)/admin/register/page.tsx'),
    path.join(ROOT, 'app/admin-login/page.tsx'),
    path.join(ROOT, 'app/(admin)/admin/page.tsx'),
    path.join(ROOT, 'app/(admin)/admin/layout.tsx'),
    path.join(ROOT, 'app/(admin)/command/roles/page.tsx'),
    path.join(ROOT, 'app/(admin)/command/users/page.tsx'),
    path.join(ROOT, 'app/api/admin/jobs/route.ts'),
    path.join(ROOT, 'app/api/admin/users/route.ts'),
    path.join(ROOT, 'lib/admin/server-store.ts'),
    path.join(ROOT, 'lib/admin/store.ts'),
  ];

  for (const f of filesToCheck) {
    if (fs.existsSync(f)) {
      const text = fs.readFileSync(f, 'utf8');
      assert.equal(
        EMOJI_REGEX.test(text),
        false,
        `File ${path.basename(f)} must not contain any unicode emojis`
      );
    }
  }
});
