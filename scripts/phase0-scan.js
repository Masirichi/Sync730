const fs = require('fs');
const path = require('path');

const terms = [
  'Tracker',
  'Kanban',
  'verified employer',
  'Verified Partner',
  'Platform Verified',
  'CAC',
  'TIN',
  'vet-once',
  'Vet-Once',
  'signal'
];

const searchDirs = ['app', 'components', 'lib', 'src', 'public'];
const hits = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Exclude command directory
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'command'].includes(entry.name)) {
        scanDir(fullPath);
      }
    } else if (/\.(tsx|ts|jsx|js|html|md|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        terms.forEach(term => {
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
console.log('Total hits:', hits.length);
hits.forEach(h => {
  console.log(`[${h.term}] ${h.file}:${h.line} -> ${h.text}`);
});
