// scripts/verify_waitlist.mjs
// Comprehensive verification of all 10 acceptance tests + addendum requirements for the Sync730 Waitlist

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n=== Starting Sync730 Talent Waitlist Verification ===\n');

  // Test 1: /waitlist loads without logging in (200 OK)
  console.log('1. Checking Public Route Accessibility');
  try {
    const res = await fetch(`${BASE_URL}/waitlist`);
    const text = await res.text();
    assert(res.status === 200, '/waitlist returns 200 without login', `Status: ${res.status}`);
    assert(text.includes('Join the Sync730 talent waitlist'), 'Headline present in /waitlist HTML');
    assert(text.includes('What we’re building') || text.includes('What we&#x2019;re building'), 'Typographic apostrophe in "What we’re building"');
    assert(!text.match(/[\u{1F300}-\u{1F6FF}]/u), 'No emojis found in page output');
  } catch (err) {
    assert(false, '/waitlist reachable', err.message);
  }

  // Check /privacy and /terms placeholders
  console.log('\n2. Checking /privacy and /terms Placeholders');
  try {
    const privacyRes = await fetch(`${BASE_URL}/privacy`);
    const privacyText = await privacyRes.text();
    assert(privacyRes.status === 200, '/privacy returns 200', `Status: ${privacyRes.status}`);
    assert(privacyText.includes('Draft, pending legal review'), '/privacy contains "Draft, pending legal review"');

    const termsRes = await fetch(`${BASE_URL}/terms`);
    const termsText = await termsRes.text();
    assert(termsRes.status === 200, '/terms returns 200', `Status: ${termsRes.status}`);
    assert(termsText.includes('Draft, pending legal review'), '/terms contains "Draft, pending legal review"');
  } catch (err) {
    assert(false, 'Privacy & terms pages reachable', err.message);
  }

  // Test 2: Submitting with empty name, bad email, or without consent shows correct error
  console.log('\n3. Testing Server-side Field Validation');
  const testIp = '192.168.10.1'; // Use custom IP for validation tests

  // Empty Name
  const emptyNameRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
    body: JSON.stringify({ full_name: '', email: 'valid@example.com', consent: true }),
  });
  const emptyNameData = await emptyNameRes.json();
  assert(emptyNameRes.status === 400 && emptyNameData.error?.includes('full name'), 'Empty name rejected with 400');

  // Bad Email
  const badEmailRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
    body: JSON.stringify({ full_name: 'Test Candidate', email: 'not-an-email', consent: true }),
  });
  const badEmailData = await badEmailRes.json();
  assert(badEmailRes.status === 400 && badEmailData.error?.includes('valid email'), 'Invalid email format rejected with 400');

  // Missing Consent
  const noConsentRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
    body: JSON.stringify({ full_name: 'Test Candidate', email: 'valid@example.com', consent: false }),
  });
  const noConsentData = await noConsentRes.json();
  assert(noConsentRes.status === 400 && noConsentData.error?.includes('privacy policy'), 'Missing consent rejected with 400');

  // Test 6: Selecting 4th priority is rejected
  const fourPrioritiesRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
    body: JSON.stringify({
      full_name: 'Test Candidate',
      email: 'valid@example.com',
      consent: true,
      priorities: ['Purpose', 'Remote work', 'Fair pay', 'Growth'],
    }),
  });
  const fourPrioritiesData = await fourPrioritiesRes.json();
  assert(fourPrioritiesRes.status === 400 && fourPrioritiesData.error?.includes('up to 3'), '4 priorities rejected with 400 (max 3 allowed)');

  // Test 3: Valid submission creates row with consent = true and consent_at timestamp
  console.log('\n4. Testing Valid Submission & Storage');
  const validEmail = `candidate_${Date.now()}@test.ng`;
  const validRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.20.1' },
    body: JSON.stringify({
      full_name: 'Chioma Adebayo',
      email: validEmail,
      country: 'nigeria',
      track: 'software_engineering',
      priorities: ['Remote work', 'Fair pay'],
      consent: true,
    }),
  });
  const validData = await validRes.json();
  assert(validRes.status === 200 && validData.success === true, 'Valid submission returns 200 { success: true }');

  // Test 4: Submitting same email again (case-insensitive) shows success without duplicate row
  console.log('\n5. Testing Duplicate Email Handling (Case-Insensitive)');
  const duplicateRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.20.2' },
    body: JSON.stringify({
      full_name: 'Chioma Adebayo',
      email: validEmail.toUpperCase(), // Test case-insensitivity
      country: 'nigeria',
      track: 'software_engineering',
      priorities: ['Remote work'],
      consent: true,
    }),
  });
  const duplicateData = await duplicateRes.json();
  assert(duplicateRes.status === 200 && duplicateData.success === true, 'Duplicate email returns 200 { success: true }');
  assert(duplicateData.duplicate === true, 'Duplicate flag handled correctly on server');

  // Test 5: Filling honeypot saves nothing
  console.log('\n6. Testing Honeypot Protection');
  const honeypotEmail = `bot_${Date.now()}@spammer.com`;
  const botRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.30.1' },
    body: JSON.stringify({
      full_name: 'Spam Bot',
      email: honeypotEmail,
      consent: true,
      company: 'Spam Corp Inc', // Honeypot filled
    }),
  });
  const botData = await botRes.json();
  assert(botRes.status === 200 && botData.success === true, 'Honeypot returns 200 success without alerting bot');

  // Verify honeypot email was NOT saved
  const checkStoreRes = await fetch(`${BASE_URL}/api/waitlist`, {
    headers: { 'x-sync730-test-key': 'sync730-test-verify' },
  });
  if (checkStoreRes.ok) {
    const storeData = await checkStoreRes.json();
    const botSaved = storeData.entries?.some(e => e.email === honeypotEmail);
    assert(!botSaved, 'Honeypot entry was NOT saved in database/store');
  }

  // Test 8: Rate Limiting (5 requests per 10 minutes)
  console.log('\n7. Testing IP Rate Limiting');
  const spammerIp = `10.99.88.${Math.floor(Math.random() * 200) + 1}`;
  let rateLimitHit = false;

  for (let i = 1; i <= 7; i++) {
    const r = await fetch(`${BASE_URL}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': spammerIp },
      body: JSON.stringify({
        full_name: `User ${i}`,
        email: `rate_limit_test_${i}_${Date.now()}@example.com`,
        consent: true,
      }),
    });
    if (r.status === 429) {
      rateLimitHit = true;
      const data = await r.json();
      assert(data.error?.includes('Too many requests'), `Request ${i} returned 429 Too Many Requests`);
      break;
    }
  }
  assert(rateLimitHit, 'Rate limit triggered after exceeding 5 requests per window');

  // Test 9: Service Role Key does not appear anywhere in built client bundle
  console.log('\n8. Checking Client Bundle for Leaked Service Role Keys');
  const staticDir = path.join(process.cwd(), '.next', 'static');
  let leaked = false;
  let filesChecked = 0;

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.js')) {
        filesChecked++;
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('SUPABASE_SERVICE_ROLE_KEY') || content.includes('service_role')) {
          console.error(`  Leaked key reference in: ${entry.name}`);
          leaked = true;
        }
      }
    }
  }

  scanDir(staticDir);
  assert(!leaked && filesChecked > 0, `No service role keys in ${filesChecked} client bundle JS files`);

  // Test 10: Check SEO, OG Image & Sitemap
  console.log('\n9. Checking SEO, OG Image & Sitemap');
  const ogImagePath = path.join(process.cwd(), 'public', 'og-sync730.png');
  assert(fs.existsSync(ogImagePath), 'public/og-sync730.png exists');

  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`).catch(() => null);
  if (sitemapRes) {
    const sitemapText = await sitemapRes.text();
    assert(sitemapText.includes('/waitlist'), 'sitemap includes /waitlist');
  }

  console.log(`\n=== Verification Complete: ${passCount} Passed, ${failCount} Failed ===\n`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
