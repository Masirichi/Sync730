const fs = require('fs');
const path = require('path');

// 1. Crawler page
const crawlerPath = path.resolve('app/(candidate)/dashboard/crawler/page.tsx');
let crawler = fs.readFileSync(crawlerPath, 'utf8');
crawler = crawler.replace(
  `text-neutral-500 border border-neutral-200/60 dark:border-neutral-800">\n                          {seniority}`,
  `text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 font-semibold">\n                          {seniority}`
);
crawler = crawler.replace(
  `className="text-xs font-medium px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">`,
  `className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">`
);
fs.writeFileSync(crawlerPath, crawler, 'utf8');
console.log('Fixed crawler contrast');

// 2. Job Detail page
const jobDetailPath = path.resolve('app/(candidate)/dashboard/jobs/[id]/page.tsx');
let detail = fs.readFileSync(jobDetailPath, 'utf8');
detail = detail.replace(
  `<span className="text-xs text-neutral-400">\n                              Learning resource & practice\n                            </span>`,
  `<span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">\n                              Learning resource & practice\n                            </span>`
);
fs.writeFileSync(jobDetailPath, detail, 'utf8');
console.log('Fixed detail contrast');

// 3. Profile page
const profilePath = path.resolve('app/(candidate)/dashboard/profile/page.tsx');
let profile = fs.readFileSync(profilePath, 'utf8');
profile = profile.replace(
  `<div className="text-xs text-neutral-400">\n                  {(profile.cvFile.size / 1024 / 1024).toFixed(2)} MB · Uploaded {new Date(profile.cvFile.uploadedAt).toLocaleDateString()}\n                </div>`,
  `<div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">\n                  {(profile.cvFile.size / 1024 / 1024).toFixed(2)} MB · Uploaded {new Date(profile.cvFile.uploadedAt).toLocaleDateString()}\n                </div>`
);
profile = profile.replace(
  `<div className="text-xs text-neutral-400 dark:text-neutral-500">\n            Scores and suggestions are AI-generated and may be wrong. You decide where to apply.\n          </div>`,
  `<div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">\n            Scores and suggestions are AI-generated and may be wrong. You decide where to apply.\n          </div>`
);
fs.writeFileSync(profilePath, profile, 'utf8');
console.log('Fixed profile contrast');
