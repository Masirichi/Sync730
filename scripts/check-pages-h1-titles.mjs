import fs from 'fs';
import path from 'path';

const commandDir = path.resolve('app/(admin)/command');
const pages = [];

function findPages(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      findPages(full);
    } else if (item.name === 'page.tsx') {
      pages.push(full);
    }
  }
}

findPages(commandDir);

for (const p of pages) {
  const content = fs.readFileSync(p, 'utf8');
  const rel = path.relative(commandDir, p);
  const h1Matches = content.match(/<h1[\s>]/g) || [];
  const titleMatches = content.match(/document\.title\s*=|title:\s*['"]/g) || [];
  console.log(`${rel} -> h1 count: ${h1Matches.length} | title set: ${titleMatches.length > 0}`);
}
