// scripts/audit-public-jobs.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const ROUTES = [
  { name: 'Public Jobs Index (/jobs)', url: 'http://localhost:3000/jobs', file: 'lh-public-jobs.json' },
  { name: 'Public Job Detail (/jobs/[slug])', url: 'http://localhost:3000/jobs/lead-systems-architect-sync730-lagos-seed-job-1', file: 'lh-public-job-detail.json' },
];

async function runAudit() {
  console.log('Auditing Public Jobs experience with Lighthouse (Mobile)...');
  const results = [];

  for (const r of ROUTES) {
    console.log(`\nAuditing ${r.name} (${r.url})...`);
    const cmd = `npx.cmd lighthouse "${r.url}" --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=scripts/${r.file} --only-categories=performance,accessibility,seo --form-factor=mobile --screenEmulation.mobile=true`;

    try {
      execSync(cmd, { stdio: 'ignore', env: { ...process.env, CHROME_PATH } });
      const report = JSON.parse(fs.readFileSync(path.join('scripts', r.file), 'utf8'));
      const perf = Math.round((report.categories.performance?.score || 0) * 100);
      const a11y = Math.round((report.categories.accessibility?.score || 0) * 100);
      const seo = Math.round((report.categories.seo?.score || 0) * 100);
      console.log(`-> ${r.name}: Performance: ${perf}/100 | Accessibility: ${a11y}/100 | SEO: ${seo}/100`);
      results.push({ name: r.name, url: r.url, performance: perf, accessibility: a11y, seo });
    } catch (e) {
      console.error(`Failed auditing ${r.name}:`, e.message);
      results.push({ name: r.name, url: r.url, error: e.message });
    }
  }

  console.log('\n=== LIGHTHOUSE AUDIT RESULTS ===');
  console.table(results);
}

runAudit();
