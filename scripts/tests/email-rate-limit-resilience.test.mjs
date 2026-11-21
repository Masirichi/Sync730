import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

test('1. Verify Admin Portal gracefully bypasses Supabase email rate limits', () => {
  const adminLoginPath = path.join(ROOT_DIR, 'app/(admin)/admin/login/page.tsx');
  assert.ok(fs.existsSync(adminLoginPath), 'Admin login page exists');

  const content = fs.readFileSync(adminLoginPath, 'utf8');

  // Verify rate limit detection
  assert.ok(content.includes('isRateLimitError'), 'Must detect rate limit error');
  assert.ok(content.includes('rate'), 'Must check for rate in error message');
  assert.ok(content.includes('toast.info'), 'Must toast information when rate limit bypassed');
  assert.ok(content.includes('provision-super-admin'), 'Must call provision-super-admin with credentials');
});

test('2. Verify Provision Super Admin API sets email_confirm and response cookies', () => {
  const provisionApiPath = path.join(ROOT_DIR, 'app/api/admin/auth/provision-super-admin/route.ts');
  assert.ok(fs.existsSync(provisionApiPath), 'Provision super admin API exists');

  const content = fs.readFileSync(provisionApiPath, 'utf8');

  assert.ok(content.includes('email_confirm: true'), 'Must set email_confirm: true to prevent confirmation emails');
  assert.ok(content.includes('res.cookies.set'), 'Must set cookies on HTTP response');
  assert.ok(content.includes('sync730_admin_email'), 'Must set sync730_admin_email cookie');
  assert.ok(content.includes('sync730_admin_role'), 'Must set sync730_admin_role cookie');
});

test('3. Verify Login page resilience for Ajah Malachy platform admin', () => {
  const loginPath = path.join(ROOT_DIR, 'app/(auth)/login/page.tsx');
  assert.ok(fs.existsSync(loginPath), 'Auth login page exists');

  const content = fs.readFileSync(loginPath, 'utf8');

  assert.ok(content.includes('isAjah'), 'Must identify Ajah Malachy email');
  assert.ok(content.includes('provision-super-admin'), 'Must provision super admin on login retry');
});

test('4. Strict Zero Emojis Compliance in all touched files', () => {
  const filesToCheck = [
    'app/(admin)/admin/login/page.tsx',
    'app/api/admin/auth/provision-super-admin/route.ts',
    'app/(auth)/login/page.tsx',
    'app/(auth)/register/page.tsx',
  ];

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  for (const relativePath of filesToCheck) {
    const fullPath = path.join(ROOT_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        assert.ok(
          !emojiRegex.test(line),
          `Emoji found in ${relativePath} at line ${index + 1}: ${line}`
        );
      });
    }
  }
});
