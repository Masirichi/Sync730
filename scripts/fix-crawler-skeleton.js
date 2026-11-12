const fs = require('fs');
let content = fs.readFileSync('app/(candidate)/dashboard/crawler/page.tsx', 'utf8');

// Fix line 689
content = content.replace(
  `<div role="status" aria-live="polite" aria-busy="true" className="space-y-6 max-w-7xl mx-auto"><span className="sr-only">Loading remote opportunities...</span>`,
  `<div className="space-y-6 max-w-7xl mx-auto">`
);

// Put live region properly on JobFeedLoadingSkeleton
content = content.replace(
  `function JobFeedLoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">`,
  `function JobFeedLoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6 max-w-7xl mx-auto">
      <span className="sr-only">Loading remote opportunities...</span>`
);

fs.writeFileSync('app/(candidate)/dashboard/crawler/page.tsx', content, 'utf8');
console.log('Fixed JobFeedLoadingSkeleton in crawler/page.tsx');
