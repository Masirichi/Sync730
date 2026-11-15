// scripts/tests/phase1-centralize-copy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();

test('Phase 1.1: content/home.ts exports typed homeCopy with all 15 required keys', async () => {
  const homeTsPath = path.join(projectRoot, 'content/home.ts');
  assert.ok(fs.existsSync(homeTsPath), 'content/home.ts must exist');

  const { homeCopy } = await import(pathToFileURL(homeTsPath).href);
  assert.ok(homeCopy, 'homeCopy must be exported');

  const requiredKeys = [
    'meta',
    'hero',
    'stats',
    'belief',
    'band',
    'candidates',
    'howItWorks',
    'latestRoles',
    'differentiators',
    'employers',
    'socialProof',
    'faq',
    'closing',
    'nav',
    'footer',
  ];

  for (const key of requiredKeys) {
    assert.ok(key in homeCopy, `homeCopy must have key: ${key}`);
    assert.ok(homeCopy[key], `homeCopy[${key}] must be defined`);
  }
});

test('Phase 1.2: lib/flags.ts exports showUnconfirmedClaims and confirmed() helper', async () => {
  const flagsPath = path.join(projectRoot, 'lib/flags.ts');
  assert.ok(fs.existsSync(flagsPath), 'lib/flags.ts must exist');

  const flagsContent = fs.readFileSync(flagsPath, 'utf8');
  assert.ok(
    flagsContent.includes('Set to true only after every [CONFIRM] claim is true.'),
    'lib/flags.ts must include required comment'
  );

  const { showUnconfirmedClaims, confirmed } = await import(
    pathToFileURL(flagsPath).href
  );
  assert.equal(showUnconfirmedClaims, false, 'showUnconfirmedClaims must default to false');
  assert.equal(typeof confirmed, 'function', 'confirmed must be a function');
  assert.equal(confirmed('test claim'), null, 'confirmed() must return null when flag is false');
  assert.equal(confirmed('test claim', true), 'test claim', 'confirmed() must return string when flag is true');
});

test('Phase 1.3: Grep shows no hardcoded headline strings left in homepage components', () => {
  const homeComponentsDir = path.join(projectRoot, 'components/home');
  const files = fs.readdirSync(homeComponentsDir).filter((f) => f.endsWith('.tsx'));

  for (const file of files) {
    const code = fs.readFileSync(path.join(homeComponentsDir, file), 'utf8');
    // Check for hardcoded tags like <h1>Text</h1> or <h2>Text</h2>
    const hardcodedHeadings = code.match(/<h[1-6][^>]*>\s*([A-Za-z0-9][^<{]+)\s*<\/h[1-6]>/g);
    assert.equal(
      hardcodedHeadings,
      null,
      `File ${file} has hardcoded headline string: ${hardcodedHeadings?.join(', ')}`
    );
  }
});
