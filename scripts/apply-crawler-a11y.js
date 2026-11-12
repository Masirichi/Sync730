const fs = require('fs');
const path = require('path');

const filePath = path.resolve('app/(candidate)/dashboard/crawler/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Transforming app/(candidate)/dashboard/crawler/page.tsx...');

// 1. Department filter chips
const oldAllRoles = `<button
            onClick={() => setSelectedCategory('All')}
            className={\`text-xs px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium \${
              selectedCategory === 'All'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
            }\`}
          >
            All Roles ({categoryCounts['All'] || 0})
          </button>`;

const newAllRoles = `<button
            type="button"
            aria-pressed={selectedCategory === 'All'}
            onClick={() => setSelectedCategory('All')}
            className={\`text-xs min-h-[44px] px-4 py-2 rounded-full transition-colors whitespace-nowrap font-medium inline-flex items-center justify-center \${
              selectedCategory === 'All'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
            }\`}
          >
            All Roles ({categoryCounts['All'] || 0})
          </button>`;

if (content.includes(oldAllRoles)) {
  content = content.replace(oldAllRoles, newAllRoles);
  console.log('SUCCESS: Updated All Roles chip');
}

const oldCatChips = `<button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={\`text-xs px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium \${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                }\`}
              >
                {meta.label} ({count})
              </button>`;

const newCatChips = `<button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat)}
                className={\`text-xs min-h-[44px] px-4 py-2 rounded-full transition-colors whitespace-nowrap font-medium inline-flex items-center justify-center \${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                }\`}
              >
                {meta.label} ({count})
              </button>`;

if (content.includes(oldCatChips)) {
  content = content.replace(oldCatChips, newCatChips);
  console.log('SUCCESS: Updated Category chips');
}

// 2. Search input & clear button
const oldSearchInput = `<Input
            placeholder="Search title, company, skills, or keywords (debounced)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 text-xs sm:text-sm h-10 border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              aria-label="Clear search query"
            >
              <X className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          )}`;

const newSearchInput = `<Input
            type="search"
            aria-label="Search remote jobs by title, company, or skills"
            placeholder="Search title, company, skills, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-12 text-base sm:text-sm min-h-[44px] h-11 border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          )}`;

if (content.includes(oldSearchInput)) {
  content = content.replace(oldSearchInput, newSearchInput);
  console.log('SUCCESS: Updated Search input');
}

// 3. Filters toggle button
const oldFiltersBtn = `<Button
                variant="outline"
                size="sm"
                className={\`h-10 px-3.5 text-xs font-semibold rounded-xl border transition-colors inline-flex items-center gap-1.5 \${
                  isFiltersOpen || activeFiltersCount > 0
                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                }\`}
              >`;

const newFiltersBtn = `<Button
                variant="outline"
                size="sm"
                aria-expanded={isFiltersOpen}
                aria-controls="filter-options-panel"
                className={\`min-h-[44px] h-11 px-4 text-xs font-semibold rounded-xl border transition-colors inline-flex items-center gap-1.5 \${
                  isFiltersOpen || activeFiltersCount > 0
                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                }\`}
              >`;

if (content.includes(oldFiltersBtn)) {
  content = content.replace(oldFiltersBtn, newFiltersBtn);
  console.log('SUCCESS: Updated Filters button');
}

// 4. Filter Panel ID
content = content.replace(
  `<CollapsibleContent className="transition-all animate-in fade-in-50 duration-200">`,
  `<CollapsibleContent id="filter-options-panel" className="transition-all animate-in fade-in-50 duration-200">`
);

// 5. Filter option chips (Seniority, Job Type, Salary Preset, Skills)
content = content.replace(
  /className=\{`text-xs px-2\.5 py-1 rounded-lg font-medium transition-colors \$\{/g,
  'type="button" aria-pressed={active} className={`text-xs min-h-[44px] px-3.5 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center ${'
);

// Skill search clear button
content = content.replace(
  `<button
                      onClick={() => setSkillSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700"
                    >`,
  `<button
                      type="button"
                      aria-label="Clear skill search query"
                      onClick={() => setSkillSearchQuery('')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                    >`
);

// 6. Live region for dynamic search results
if (!content.includes('role="status" aria-live="polite" className="sr-only"')) {
  content = content.replace(
    `<div className="space-y-6">
          {/* Top Section: Recommended for You (Requirement 3) */}`,
    `<div role="status" aria-live="polite" className="sr-only">
        {filteredJobs.length} {filteredJobs.length === 1 ? 'position found' : 'positions found'}
      </div>

      <div className="space-y-6">
          {/* Top Section: Recommended for You (Requirement 3) */}`
  );
  console.log('SUCCESS: Added live region');
}

// 7. Loading skeleton live region
content = content.replace(
  `<div className="space-y-6 max-w-7xl mx-auto">`,
  `<div role="status" aria-live="polite" aria-busy="true" className="space-y-6 max-w-7xl mx-auto"><span className="sr-only">Loading remote opportunities...</span>`
);

// 8. Card buttons min-h-[44px] & aria-labels
content = content.replace(
  `onClick={(e) => {
                            e.stopPropagation();
                            setTailorTargetJob({
                              title: job.title,
                              company: job.company_name || job.company,
                              location: job.candidate_required_location || job.location_tier,
                              description: job.description || '',
                              salary: job.salary || undefined,
                              category: job.category || 'Software & Engineering',
                            });
                            setIsTailorPanelOpen(true);
                          }}
                          className="text-xs h-9 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 font-medium inline-flex items-center gap-1.5"`,
  `onClick={(e) => {
                            e.stopPropagation();
                            setTailorTargetJob({
                              title: job.title,
                              company: job.company_name || job.company,
                              location: job.candidate_required_location || job.location_tier,
                              description: job.description || '',
                              salary: job.salary || undefined,
                              category: job.category || 'Software & Engineering',
                            });
                            setIsTailorPanelOpen(true);
                          }}
                          aria-label={\`Tailor resume for \${job.title} at \${job.company_name || job.company}\`}
                          className="text-xs min-h-[44px] h-11 px-3.5 rounded-lg border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 font-medium inline-flex items-center gap-1.5"`
);

content = content.replace(
  `onClick={(e) => handleToggleSaveJob(e, job)}
                          className={\`w-[90px] text-xs h-9 px-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1 \${
                            isSaved
                              ? 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 bg-neutral-100/60 dark:bg-neutral-900'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 hover:text-neutral-900'
                          }\`}`,
  `onClick={(e) => handleToggleSaveJob(e, job)}
                          aria-label={isSaved ? \`Remove \${job.title} from saved jobs\` : \`Save \${job.title} to saved jobs\`}
                          className={\`min-h-[44px] h-11 px-3 w-[100px] text-xs rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1 \${
                            isSaved
                              ? 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 bg-neutral-100/60 dark:bg-neutral-900'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 hover:text-neutral-900'
                          }\`}`
);

content = content.replace(
  `onClick={(e) => handleApplyClick(e, job)}
                          className="text-xs h-9 px-3.5 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold inline-flex items-center gap-1"`,
  `onClick={(e) => handleApplyClick(e, job)}
                          aria-label={\`Apply directly for \${job.title} at \${job.company_name || job.company}\`}
                          className="text-xs min-h-[44px] h-11 px-4 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold inline-flex items-center gap-1"`
);

// 9. Badges: Don't rely on color alone! Explicit text status
content = content.replace(
  `{job.open_to_nigeria ? (
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              ● Open to Nigeria
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
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

// 10. Meaningful link text for Recommended cards
content = content.replace(
  `<span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                        View →
                      </span>`,
  `<span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                        View details <span className="sr-only">for {job.title}</span> →
                      </span>`
);

// 11. Headings in Card: card title should be h3
content = content.replace(
  `<h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors leading-snug">
                        <Link
                          href={\`/dashboard/jobs/\${job.id}?\${searchParams.toString()}\`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {job.title}
                        </Link>
                      </h2>`,
  `<h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors leading-snug">
                        <Link
                          href={\`/dashboard/jobs/\${job.id}?\${searchParams.toString()}\`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {job.title}
                        </Link>
                      </h3>`
);

// Recommended card title
content = content.replace(
  `<h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h4>`,
  `<h3 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>`
);

// Recommended section title: h2
content = content.replace(
  `<h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                      Recommended for You
                    </h3>`,
  `<h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                      Recommended for You
                    </h2>`
);

// 12. Eliminate all text-[10px] and text-[11px]
content = content.replace(/text-\[1[01]px\]/g, 'text-xs');

// 13. Ensure descriptions are 14px (text-sm)
content = content.replace(
  `className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3"`,
  `className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-3"`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Finished updating app/(candidate)/dashboard/crawler/page.tsx');
