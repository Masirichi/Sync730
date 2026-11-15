const fs = require('fs');
const path = require('path');

const targets = ['26', '25+', '137'];
const searchDirs = ['app', 'components', 'lib', 'src'];
const hits = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(entry.name)) {
        scanDir(fullPath);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        targets.forEach(t => {
          if (line.includes(t)) {
            hits.push({
              file: fullPath.replace(/\\/g, '/'),
              line: idx + 1,
              target: t,
              text: line.trim()
            });
          }
        });
      });
    }
  }
}

searchDirs.forEach(d => { if (fs.existsSync(d)) scanDir(d); });
console.log('Hits for stats targets:', hits.length);
hits.forEach(h => {
  console.log(`[${h.target}] ${h.file}:${h.line} -> ${h.text}`);
});
