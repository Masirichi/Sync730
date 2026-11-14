// scripts/run-lh-home.js
const { execSync } = require('child_process');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Auditing Homepage with Lighthouse...');
const cmd = `npx.cmd lighthouse "http://localhost:3000/" --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=scripts/lh-homepage.json --only-categories=accessibility,seo,performance --preset=desktop`;

try {
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, CHROME_PATH } });
  const report = JSON.parse(fs.readFileSync('scripts/lh-homepage.json', 'utf8'));
  console.log('\n=== LIGHTHOUSE SCORES ===');
  console.log('Performance:', Math.round((report.categories.performance?.score || 0) * 100));
  console.log('Accessibility:', Math.round((report.categories.accessibility?.score || 0) * 100));
  console.log('SEO:', Math.round((report.categories.seo?.score || 0) * 100));
} catch (e) {
  console.error('Lighthouse error:', e.message);
}
