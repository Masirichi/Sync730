const fs = require('fs');
const path = require('path');

// 1. Job detail sticky bar
const jobDetailPath = path.resolve('app/(candidate)/dashboard/jobs/[id]/page.tsx');
let jobDetail = fs.readFileSync(jobDetailPath, 'utf8');
jobDetail = jobDetail.replace(
  `<p className="text-xs text-neutral-500 truncate">`,
  `<p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate">`
);
fs.writeFileSync(jobDetailPath, jobDetail, 'utf8');
console.log('Fixed job detail sticky bar text contrast');

// 2. Auth layout
const authLayoutPath = path.resolve('app/(auth)/layout.tsx');
let authLayout = fs.readFileSync(authLayoutPath, 'utf8');
authLayout = authLayout.replace(
  `<div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex xl:p-14 select-none">`,
  `<aside aria-label="Brand introduction" className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex xl:p-14 select-none">`
);
authLayout = authLayout.replace(
  `<p className="relative text-sm text-background/45">© 2026 Sync730</p>\n      </div>`,
  `<p className="relative text-sm text-background/70">© 2026 Sync730</p>\n      </aside>`
);
fs.writeFileSync(authLayoutPath, authLayout, 'utf8');
console.log('Fixed auth layout landmark and contrast');
