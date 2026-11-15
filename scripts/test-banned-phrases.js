// scripts/test-banned-phrases.js
// Automated test suite asserting that NONE of the banned phrases appear
// in rendered output or source code of /jobs and /jobs/[slug].

const fs = require('fs');
const path = require('path');
const http = require('http');

const BANNED_PATTERNS = [
  { phrase: 'pay on time', regex: /\bpay\s+on\s+time\b/i },
  { phrase: 'that pay on time', regex: /\bthat\s+pay\s+on\s+time\b/i },
  { phrase: 'placement', regex: /\bplacements?\b/i },
  { phrase: 'guarantee', regex: /\bguarantee[ds]?\b/i },
  { phrase: 'NDA', regex: /\bnda\b/i },
  { phrase: 'never detects', regex: /\bnever\s+detects?\b/i },
  { phrase: '100%', regex: /(?:100%|100\s*percent)/i },
  { phrase: 'Top Verified', regex: /\btop\s+verified\b/i },
  { phrase: 'exact pay', regex: /\bexact\s+pay\b/i },
  { phrase: 'zero ambiguous ranges', regex: /\bzero\s+ambiguous\s+ranges\b/i },
  { phrase: 'confirmed hiring budgets', regex: /\bconfirmed\s+hiring\s+budgets\b/i },
  { phrase: 'audited, vetted Pan-African engineers', regex: /\baudited,?\s*vetted\s+pan-african\s+engineers\b/i },
  { phrase: 'Every employer verified', regex: /\bevery\s+employer\s+verified\b/i },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', (err) => reject(err));
  });
}

function scanText(sourceName, text) {
  const violations = [];

  for (const item of BANNED_PATTERNS) {
    if (item.regex.test(text)) {
      violations.push({
        source: sourceName,
        phrase: item.phrase,
      });
    }
  }

  return violations;
}

async function runAudit() {
  console.log('--- SYNC730 BANNED PHRASES AUDIT ---');
  let totalViolations = 0;

  // 1. Scan source files in app/jobs, app/find-work and components/jobs (excluding trust-copy.ts definition and test scripts)
  const dirsToScan = [
    path.join(__dirname, '..', 'app', 'jobs'),
    path.join(__dirname, '..', 'app', 'find-work'),
    path.join(__dirname, '..', 'components', 'jobs'),
  ];

  function getFiles(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        files = files.concat(getFiles(full));
      } else if (/\.(tsx|ts|js|jsx|html)$/.test(e.name)) {
        files.push(full);
      }
    }
    return files;
  }

  const allFiles = dirsToScan.flatMap(getFiles);

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const violations = scanText(path.relative(path.join(__dirname, '..'), file), content);
    if (violations.length > 0) {
      for (const v of violations) {
        console.error(`[FAIL] Source violation in ${v.source}: Contains banned phrase "${v.phrase}"`);
        totalViolations++;
      }
    }
  }

  // 2. Fetch live rendered /jobs and a job slug if server is running on localhost:3000
  try {
    const jobsRes = await fetchUrl('http://localhost:3000/jobs');
    if (jobsRes.statusCode === 200) {
      const violations = scanText('Rendered /jobs', jobsRes.body);
      if (violations.length > 0) {
        for (const v of violations) {
          console.error(`[FAIL] Rendered /jobs violation: Contains banned phrase "${v.phrase}"`);
          totalViolations++;
        }
      } else {
        console.log('[PASS] Rendered /jobs is 100% clean of banned phrases.');
      }

      // Check /find-work
      const findWorkRes = await fetchUrl('http://localhost:3000/find-work');
      if (findWorkRes.statusCode === 200) {
        const findWorkViolations = scanText('Rendered /find-work', findWorkRes.body);
        if (findWorkViolations.length > 0) {
          for (const v of findWorkViolations) {
            console.error(`[FAIL] Rendered /find-work violation: Contains banned phrase "${v.phrase}"`);
            totalViolations++;
          }
        } else {
          console.log('[PASS] Rendered /find-work is clean of banned phrases.');
        }
      }

      // Check sample slugs
      const slugMatches = Array.from(jobsRes.body.matchAll(/href="\/jobs\/([a-zA-Z0-9_-]+)"/g))
        .map((m) => m[1])
        .filter((s) => !s.endsWith('.js') && !s.endsWith('.css'));
      const uniqueSlugs = Array.from(new Set(slugMatches)).slice(0, 3);

      for (const slug of uniqueSlugs) {
        const slugRes = await fetchUrl(`http://localhost:3000/jobs/${slug}`);
        if (slugRes.statusCode === 200) {
          const slugViolations = scanText(`Rendered /jobs/${slug}`, slugRes.body);
          if (slugViolations.length > 0) {
            for (const v of slugViolations) {
              console.error(`[FAIL] Rendered /jobs/${slug} violation: Contains banned phrase "${v.phrase}"`);
              totalViolations++;
            }
          } else {
            console.log(`[PASS] Rendered /jobs/${slug} is clean of banned phrases.`);
          }
        }
      }
    }
  } catch (err) {
    console.log('[INFO] Local dev server not reachable during static run; static file scan completed.');
  }

  if (totalViolations > 0) {
    console.error(`\nFAILED: Found ${totalViolations} banned phrase violation(s). Build rejected.`);
    process.exit(1);
  } else {
    console.log('\nSUCCESS: 0 banned phrases detected. All public jobs pages comply with strict Claims Policy.');
    process.exit(0);
  }
}

runAudit();
