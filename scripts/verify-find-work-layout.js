// scripts/verify-find-work-layout.js
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
  console.log('Testing /find-work Layout Rebuild...');

  const html = await fetch('http://localhost:3000/find-work');

  const checks = [
    {
      name: 'Hero H1 "Real remote jobs, open to Africa"',
      pass: html.includes('Real remote jobs, open to Africa'),
    },
    {
      name: 'Hero subline "Verified roles in customer support, engineering and beyond"',
      pass: html.includes('Verified roles in customer support, engineering and beyond'),
    },
    {
      name: 'Hero subline ends with "all confirmed open to Africa"',
      pass: html.includes('all confirmed open to Africa'),
    },
    {
      name: 'Integrated Search input present',
      pass: html.includes('placeholder="Search role, skill, or keyword…"'),
    },
    {
      name: 'Location select present with Lagos, Abuja, Remote global',
      pass: html.includes('value="lagos"') && html.includes('value="abuja"') && html.includes('value="remote global"'),
    },
    {
      name: 'Visible Search button',
      pass: html.includes('>Search<') || html.includes('<span>Search</span>'),
    },
    {
      name: 'Popular location pills',
      pass: html.includes('Popular:') && html.includes('Lagos') && html.includes('Abuja'),
    },
    {
      name: 'Trust strip: "Every role confirmed real"',
      pass: html.includes('Every role confirmed real'),
    },
    {
      name: 'Trust strip: "Africa eligibility stated upfront"',
      pass: html.includes('Africa eligibility stated upfront'),
    },
    {
      name: 'Trust strip: "Track applications in SyncFlow"',
      pass: html.includes('Track applications in SyncFlow'),
    },
    {
      name: 'Sticky Filter Bar with work-mode chips (All, Remote, Hybrid, Onsite)',
      pass: html.includes('Remote') && html.includes('Hybrid') && html.includes('Onsite'),
    },
    {
      name: 'Category chip row (Customer Support, Software Engineering, Design, etc.)',
      pass: html.includes('Customer Support') && html.includes('Software Engineering') && html.includes('Design'),
    },
    {
      name: 'Filters button and Sort select',
      pass: html.includes('Filters') && html.includes('Newest') && html.includes('Highest salary'),
    },
    {
      name: 'Results heading with aria-live="polite"',
      pass: html.includes('aria-live="polite"') && html.includes('active role'),
    },
    {
      name: 'All roles 2-column grid layout (grid-cols-1 md:grid-cols-2)',
      pass: html.includes('grid-cols-1 md:grid-cols-2'),
    },
    {
      name: 'Bottom value strip: "Real roles only."',
      pass: html.includes('Real roles only.'),
    },
    {
      name: 'Bottom value strip: "Africa-eligible, stated upfront."',
      pass: html.includes('Africa-eligible, stated upfront.'),
    },
    {
      name: 'Bottom value strip: "SyncFlow: your private pipeline."',
      pass: html.includes('SyncFlow: your private pipeline.'),
    },
  ];

  let allPassed = true;
  checks.forEach((c) => {
    const status = c.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`[${status}] ${c.name}`);
    if (!c.pass) allPassed = false;
  });

  if (allPassed) {
    console.log('\nALL 18 VERIFICATION CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error('\nSOME VERIFICATION CHECKS FAILED!');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
