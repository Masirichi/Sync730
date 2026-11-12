const fs = require('fs');
const path = require('path');

const filePath = path.resolve('app/(candidate)/dashboard/jobs/[id]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Transforming app/(candidate)/dashboard/jobs/[id]/page.tsx...');

// 1. Back link accessible label and tap target
content = content.replace(
  `className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"`,
  `aria-label="Back to verified jobs list" className="inline-flex items-center gap-2 text-xs font-semibold min-h-[44px] py-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"`
);

// 2. Badges: Don't rely on color alone
content = content.replace(
  `{job.open_to_nigeria ? (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ● Open to Nigeria
                  </span>
                ) : (
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                    Not open to Nigeria
                  </span>
                )}`,
  `{job.open_to_nigeria ? (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Status: Open to Nigeria
                  </span>
                ) : (
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                    Status: Not open to Nigeria
                  </span>
                )}`
);

// 3. Sticky bottom action bar: tap targets min-h-[44px], safe-area inset
content = content.replace(
  `<div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 py-3.5 px-4 shadow-lg">`,
  `<div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 py-3.5 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom,0px))] shadow-lg">`
);

// Save button in sticky bar
content = content.replace(
  `onClick={handleToggleSave}
              disabled={isSaving}
              className="w-[100px] text-xs h-9 font-semibold border-neutral-200 dark:border-neutral-800"`,
  `onClick={handleToggleSave}
              disabled={isSaving}
              aria-label={isSaved ? \`Remove \${job.title} from saved jobs\` : \`Save \${job.title} to saved jobs\`}
              className="w-[104px] text-xs min-h-[44px] h-11 font-semibold border-neutral-200 dark:border-neutral-800"`
);

// Tailor button in sticky bar
content = content.replace(
  `onClick={() => setIsTailorPanelOpen(true)}
              className="gap-1.5 text-xs h-9 font-semibold border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"`,
  `onClick={() => setIsTailorPanelOpen(true)}
              aria-label={\`Tailor resume for \${job.title} at \${job.company_name || job.company}\`}
              className="gap-1.5 text-xs min-h-[44px] h-11 px-4 font-semibold border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"`
);

// Apply button in sticky bar
content = content.replace(
  `onClick={handleApplyDirectly}
              className="gap-1.5 text-xs h-9 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 px-4"`,
  `onClick={handleApplyDirectly}
              aria-label={\`Apply directly for \${job.title} at \${job.company_name || job.company}\`}
              className="gap-1.5 text-xs min-h-[44px] h-11 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 px-5"`
);

// 4. In-page action buttons (top action row if present)
content = content.replace(
  /className="([^"]*)h-9([^"]*)"/g,
  'className="$1min-h-[44px] h-11$2"'
);

// 5. Replace all text-[10px] and text-[11px]
content = content.replace(/text-\[1[01]px\]/g, 'text-xs');

// 6. Ensure prose is text-sm text-neutral-700
content = content.replace(
  /className="prose dark:prose-invert text-xs text-neutral-600/g,
  'className="prose dark:prose-invert text-sm text-neutral-700 dark:text-neutral-300'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Finished updating app/(candidate)/dashboard/jobs/[id]/page.tsx');
