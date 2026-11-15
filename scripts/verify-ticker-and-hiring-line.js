// scripts/verify-ticker-and-hiring-line.js
const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

async function verify() {
  console.log('Testing Live Endpoints...');

  const homeHtml = await fetch('http://localhost:3000/');
  console.log('1. Homepage Checks:');
  console.log('   - Has "Latest roles":', homeHtml.includes('Latest roles'));
  console.log('   - Has "Hiring Now • Live Feed":', homeHtml.includes('Hiring Now • Live Feed'));
  console.log('   - Has "/find-work":', homeHtml.includes('/find-work'));
  console.log('   - Has "Remote, Hybrid &amp; Onsite" or similar:', /Remote,\s*Hybrid/i.test(homeHtml));
  console.log('   - Has "Vet-Once Profile":', homeHtml.includes('Vet-Once Profile'));

  const jobsHtml = await fetch('http://localhost:3000/jobs');
  console.log('\n2. /jobs Page Checks:');
  const hasEmployersReviewed = jobsHtml.includes('Employers reviewed by our team');
  const hasPayRangesShown = jobsHtml.includes('Pay ranges shown up front');
  console.log('   - Has "Employers reviewed by our team":', hasEmployersReviewed, hasEmployersReviewed ? '[FAIL]' : '[PASS]');
  console.log('   - Has "Pay ranges shown up front":', hasPayRangesShown, hasPayRangesShown ? '[FAIL]' : '[PASS]');
  const hasSignupCompany = jobsHtml.includes('href="/signup/company"');
  console.log('   - Post a role connects to /signup/company:', hasSignupCompany, hasSignupCompany ? '[PASS]' : '[FAIL]');

  if (
    homeHtml.includes('Latest roles') &&
    homeHtml.includes('Hiring Now • Live Feed') &&
    !hasEmployersReviewed &&
    !hasPayRangesShown &&
    hasSignupCompany
  ) {
    console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('\nSOME VERIFICATION CHECKS FAILED!');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
