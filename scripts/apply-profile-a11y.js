const fs = require('fs');
const path = require('path');

const filePath = path.resolve('app/(candidate)/dashboard/profile/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Transforming app/(candidate)/dashboard/profile/page.tsx...');

// 1. Inputs tap target min-h-[44px] and font-size 16px to prevent iOS zoom
content = content.replace(
  /className="text-xs h-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"/g,
  'className="text-base sm:text-sm min-h-[44px] h-11 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"'
);

// Phone input type="tel"
content = content.replace(
  `value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+234 803 123 4567"`,
  `type="tel"
                  autoComplete="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+234 803 123 4567"`
);

// Years of experience input type="number"
content = content.replace(
  `value={profile.yearsOfExperience}
                  onChange={(e) =>
                    setProfile({ ...profile, yearsOfExperience: parseInt(e.target.value) || 0 })
                  }`,
  `type="number"
                  min="0"
                  max="50"
                  value={profile.yearsOfExperience}
                  onChange={(e) =>
                    setProfile({ ...profile, yearsOfExperience: parseInt(e.target.value) || 0 })
                  }`
);

// Minimum salary input type="number"
content = content.replace(
  `value={profile.minimumSalary || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, minimumSalary: parseInt(e.target.value) || undefined })
                    }`,
  `type="number"
                    min="0"
                    step="1000"
                    value={profile.minimumSalary || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, minimumSalary: parseInt(e.target.value) || undefined })
                    }`
);

// Bio textarea
content = content.replace(
  `className="text-xs min-h-[70px] bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"`,
  `className="text-base sm:text-sm min-h-[90px] bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"`
);

// Buttons: Save changes button min-h-[44px]
content = content.replace(
  `className="text-xs font-semibold h-10 px-5 gap-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"`,
  `className="text-xs font-semibold min-h-[44px] h-11 px-6 gap-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"`
);

// Profile strength card title: h2
content = content.replace(
  `<h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Profile strength: {strength.score}%
                </h3>`,
  `<h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Profile strength: {strength.score}%
                </h2>`
);

// All other buttons in profile
content = content.replace(
  /className="text-xs h-8/g,
  'className="text-xs min-h-[44px] px-3.5'
);
content = content.replace(
  /className="text-xs h-9/g,
  'className="text-xs min-h-[44px] px-4'
);

// Replace all text-[10px] and text-[11px]
content = content.replace(/text-\[1[01]px\]/g, 'text-xs');

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Finished updating app/(candidate)/dashboard/profile/page.tsx');
