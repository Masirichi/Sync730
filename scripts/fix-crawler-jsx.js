const fs = require('fs');
let content = fs.readFileSync('app/(candidate)/dashboard/crawler/page.tsx', 'utf8');

const target = `      ) : (
        /* State View 4: Filtered Job Listings Feed & Pagination */
        <div role="status" aria-live="polite" className="sr-only">
        {filteredJobs.length} {filteredJobs.length === 1 ? 'position found' : 'positions found'}
      </div>

      <div className="space-y-6">`;

const replacement = `      ) : (
        /* State View 4: Filtered Job Listings Feed & Pagination */
        <div className="space-y-6">
          {/* Accessible live region for dynamic search results */}
          <div role="status" aria-live="polite" className="sr-only">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'position found' : 'positions found'}
          </div>`;

if (!content.includes(target)) {
  console.log('Target not found, trying normalized search...');
  content = content.replace(
    /\)\s*:\s*\(\s*\/\* State View 4: Filtered Job Listings Feed & Pagination \*\/\s*<div role="status" aria-live="polite" className="sr-only">[\s\S]*?<\/div>\s*<div className="space-y-6">/,
    replacement
  );
} else {
  content = content.replace(target, replacement);
}

fs.writeFileSync('app/(candidate)/dashboard/crawler/page.tsx', content, 'utf8');
console.log('Fixed JSX in crawler/page.tsx successfully');
