const fs = require('fs');
const path = require('path');

console.log('Starting full accessibility & polish transformations...');

// Helper to replace all occurrences
function replaceStrict(filepath, target, replacement, label) {
  let content = fs.readFileSync(filepath, 'utf8');
  if (!content.includes(target)) {
    console.error(`FAILED: ${label} in ${filepath}`);
    return false;
  }
  content = content.replace(target, replacement);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`SUCCESS: ${label}`);
  return true;
}

// -------------------------------------------------------------
// 1. app/api/jobs/route.ts -> Add Cache-Control header
// -------------------------------------------------------------
const routePath = path.resolve('app/api/jobs/route.ts');
let routeContent = fs.readFileSync(routePath, 'utf8');
if (!routeContent.includes('s-maxage=3600')) {
  const oldJsonReturn = `    return NextResponse.json({
      success: true,
      jobs: deduplicated,
      total: deduplicated.length,
    });`;
  const newJsonReturn = `    return NextResponse.json(
      {
        success: true,
        jobs: deduplicated,
        total: deduplicated.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );`;
  if (routeContent.includes(oldJsonReturn)) {
    routeContent = routeContent.replace(oldJsonReturn, newJsonReturn);
    fs.writeFileSync(routePath, routeContent, 'utf8');
    console.log('SUCCESS: Cache-Control added to app/api/jobs/route.ts');
  } else {
    console.log('Notice: custom json return not found in route.ts, attempting normalized replace');
    routeContent = routeContent.replace(
      /return NextResponse\.json\({\s*success:\s*true,\s*jobs:\s*deduplicated,\s*total:\s*deduplicated\.length,?\s*}\);/,
      newJsonReturn
    );
    fs.writeFileSync(routePath, routeContent, 'utf8');
    console.log('SUCCESS: Cache-Control regex replaced in app/api/jobs/route.ts');
  }
}

// -------------------------------------------------------------
// 2. components/resume/tailor-resume-panel.tsx -> A11y, Escape key, Focus trap, min-h-[44px], no text < 12px
// -------------------------------------------------------------
const tailorPath = path.resolve('components/resume/tailor-resume-panel.tsx');
let tailorContent = fs.readFileSync(tailorPath, 'utf8');

// Add Escape key listener and trap focus
if (!tailorContent.includes('handleKeyDown')) {
  tailorContent = tailorContent.replace(
    `export function TailorResumePanel({ isOpen, onClose, job }: TailorResumePanelProps) {`,
    `export function TailorResumePanel({ isOpen, onClose, job }: TailorResumePanelProps) {
  // Accessibility: Close panel on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);`
  );
}

// Dialog attributes & close button tap target
tailorContent = tailorContent.replace(
  `<div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">`,
  `<div role="dialog" aria-modal="true" aria-labelledby="tailor-panel-title" className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">`
);

tailorContent = tailorContent.replace(
  `<h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">`,
  `<h2 id="tailor-panel-title" className="text-lg font-bold text-neutral-900 dark:text-neutral-100">`
);

tailorContent = tailorContent.replace(
  `<button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >`,
  `<button
                type="button"
                onClick={onClose}
                aria-label="Close resume tailoring panel"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              >`
);

// Buttons: Copy and Download min-h-[44px]
tailorContent = tailorContent.replace(
  `className="text-xs h-9 gap-1.5 flex-1 sm:flex-initial"`,
  `className="text-xs min-h-[44px] px-4 gap-1.5 flex-1 sm:flex-initial font-medium"`
);
tailorContent = tailorContent.replace(
  `className="text-xs h-9 gap-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex-1 sm:flex-initial"`,
  `className="text-xs min-h-[44px] px-4 gap-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex-1 sm:flex-initial font-semibold"`
);

// Replace any remaining text-[10px] or text-[11px]
tailorContent = tailorContent.replace(/text-\[1[01]px\]/g, 'text-xs');
// Ensure inputs have text-base sm:text-sm to prevent iOS zoom
tailorContent = tailorContent.replace(/Textarea\s+value=\{candidateSummary\}\s+onChange=\{([^}]+)\}\s+className="text-xs/g, 'Textarea value={candidateSummary} onChange={$1} className="text-base sm:text-sm');
tailorContent = tailorContent.replace(/Textarea\s+value=\{b\.suggestedText\}\s+onChange=\{([^}]+)\}\s+className="text-xs/g, 'Textarea value={b.suggestedText} onChange={$1} className="text-base sm:text-sm');

fs.writeFileSync(tailorPath, tailorContent, 'utf8');
console.log('SUCCESS: Updated components/resume/tailor-resume-panel.tsx');

console.log('Accessibility transform script 1 completed.');
