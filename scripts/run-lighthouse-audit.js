const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const ROUTES = [
  { name: 'Login Page', url: 'http://localhost:3000/login', auth: false, file: 'lh-login.json' },
  { name: 'Jobs Board', url: 'http://localhost:3000/dashboard/crawler', auth: true, file: 'lh-jobs.json' },
  { name: 'Job Detail Page', url: 'http://localhost:3000/dashboard/jobs/seed-job-1', auth: true, file: 'lh-job-detail.json' },
  { name: 'Application Tracker', url: 'http://localhost:3000/dashboard/tracker', auth: true, file: 'lh-tracker.json' },
  { name: 'Candidate Profile', url: 'http://localhost:3000/dashboard/profile', auth: true, file: 'lh-profile.json' },
];

async function runLighthouseAudits() {
  console.log('Running Lighthouse audits across 5 target pages...');
  const results = [];

  for (const r of ROUTES) {
    console.log(`\nAuditing ${r.name} (${r.url})...`);
    const extraHeaders = r.auth
      ? `--extra-headers="{\\"Cookie\\":\\"sync730-demo-role=candidate\\"}"`
      : '';

    const cmd = `npx.cmd lighthouse "${r.url}" --chrome-flags="--headless --no-sandbox" --output=json --output-path=scripts/${r.file} --only-categories=accessibility,performance --form-factor=mobile --screenEmulation.mobile=true ${extraHeaders}`;

    try {
      execSync(cmd, { stdio: 'ignore', env: { ...process.env, CHROME_PATH } });
      const report = JSON.parse(fs.readFileSync(path.join('scripts', r.file), 'utf8'));
      const perfScore = Math.round((report.categories.performance?.score || 0) * 100);
      const a11yScore = Math.round((report.categories.accessibility?.score || 0) * 100);
      console.log(`-> ${r.name}: Performance: ${perfScore}/100 | Accessibility: ${a11yScore}/100`);
      results.push({
        name: r.name,
        url: r.url,
        performance: perfScore,
        accessibility: a11yScore,
      });
    } catch (e) {
      console.error(`Failed auditing ${r.name}:`, e.message);
      results.push({
        name: r.name,
        url: r.url,
        error: e.message,
      });
    }
  }

  fs.writeFileSync('scripts/lighthouse-summary.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\nLighthouse audit run finished! Saved to scripts/lighthouse-summary.json');
}

runLighthouseAudits();
