const fs = require('fs');
const path = require('path');

const bannedTerms = [
  'unbiased',
  'guaranteed',
  'AI recruiter',
  'detects cheating',
  'Save to Tracker',
  'Kanban Tracker',
  'One-Click Kanban'
];

const searchDirs = ['app', 'components', 'lib', 'src'];
const hits = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'command'].includes(entry.name)) {
        scanDir(fullPath);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        bannedTerms.forEach(term => {
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          if (regex.test(line)) {
            hits.push({
              file: fullPath.replace(/\\/g, '/'),
              line: idx + 1,
              term,
              text: line.trim()
            });
          }
        });
      });
    }
  }
}

searchDirs.forEach(d => { if (fs.existsSync(d)) scanDir(d); });
console.log('Total hits found:', hits.length);
hits.forEach(h => {
  console.log(`[${h.term}] ${h.file}:${h.line} -> ${h.text}`);
});
