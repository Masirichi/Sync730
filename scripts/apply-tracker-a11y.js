const fs = require('fs');
const path = require('path');

const filePath = path.resolve('app/(candidate)/dashboard/tracker/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Transforming app/(candidate)/dashboard/tracker/page.tsx...');

// 1. Column header heading: h2
content = content.replace(
  `<span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    {col.label}
                  </span>`,
  `<h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    {col.label}
                  </h2>`
);

// 2. Card title heading: h3
content = content.replace(
  `<h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                          {item.title}
                        </h4>`,
  `<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                          {item.title}
                        </h3>`
);

// 3. Search input & Track External Job button tap target
content = content.replace(
  `className="pl-9 text-sm border-neutral-200 dark:border-neutral-800"`,
  `type="search" aria-label="Search tracked jobs or notes" className="pl-9 text-base sm:text-sm min-h-[44px] h-11 border-neutral-200 dark:border-neutral-800"`
);

content = content.replace(
  `onClick={() => setIsAddModalOpen(true)}
          className="gap-2 text-xs"`,
  `onClick={() => setIsAddModalOpen(true)}
          className="gap-2 text-xs min-h-[44px] h-11 px-4 font-semibold"`
);

// 4. Delete button on card tap target & aria-label
content = content.replace(
  `<button
                            onClick={() => handleDelete(item.id)}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-0.5 rounded"
                            title="Remove from tracker"
                          >`,
  `<button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            aria-label={\`Remove \${item.title} at \${item.company} from tracker\`}
                            className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2 rounded"
                            title="Remove from tracker"
                          >`
);

// 5. Notes field accessible interactive target
content = content.replace(
  `onClick={() => {
                            setEditingNotesItem(item);
                            setNotesText(item.notes || '');
                          }}
                          className="rounded bg-neutral-100 dark:bg-neutral-900 p-2 text-[11px] text-neutral-600 dark:text-neutral-400 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors line-clamp-2"
                          title="Click to edit notes"`,
  `role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setEditingNotesItem(item);
                              setNotesText(item.notes || '');
                            }
                          }}
                          onClick={() => {
                            setEditingNotesItem(item);
                            setNotesText(item.notes || '');
                          }}
                          aria-label={\`Edit notes for \${item.title}\`}
                          className="rounded bg-neutral-100 dark:bg-neutral-900 p-2.5 min-h-[44px] text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors line-clamp-2"
                          title="Click to edit notes"`
);

// 6. Practice interview button tap target
content = content.replace(
  `className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-[11px] font-medium transition-all shadow-sm"`,
  `className="flex items-center justify-center gap-1.5 w-full min-h-[44px] py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-semibold transition-all shadow-sm"`
);

// 7. Status dropdown & link tap targets
content = content.replace(
  `<SelectTrigger className="h-7 text-[11px] px-2 py-0 border-neutral-200 dark:border-neutral-800">`,
  `<SelectTrigger aria-label={\`Status for \${item.title}\`} className="h-9 min-h-[36px] text-xs px-2.5 py-1 border-neutral-200 dark:border-neutral-800">`
);

content = content.replace(
  `className="flex items-center gap-0.5 text-[11px] text-neutral-700 dark:text-neutral-300 hover:underline font-medium shrink-0"`,
  `aria-label={\`Visit posting for \${item.title} in new tab\`} className="flex items-center gap-1 min-h-[44px] px-2 text-xs text-neutral-700 dark:text-neutral-300 hover:underline font-medium shrink-0"`
);

// 8. Textarea in edit notes modal
content = content.replace(
  `className="text-xs"`,
  `className="text-base sm:text-sm min-h-[100px]"`
);

// 9. Buttons in dialogs
content = content.replace(
  /className="text-xs h-9"/g,
  'className="text-xs min-h-[44px] h-11 px-4"'
);

// 10. Eliminate all text-[10px] and text-[11px]
content = content.replace(/text-\[1[01]px\]/g, 'text-xs');

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Finished updating app/(candidate)/dashboard/tracker/page.tsx');
