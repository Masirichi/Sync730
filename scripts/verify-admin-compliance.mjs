// scripts/verify-admin-compliance.mjs
// Compliance verification script for Sync730 Command Center (/command/*).
// Fails the build with exit code 1 if banned items appear:
// - Emojis (pictographs / emoji glyphs)
// - Raw enums in user-facing JSX text (e.g. PLATFORM_ADMIN, NEEDS_REVIEW, etc.)
// - Terminal styling (e.g. mock $ shell prompts, hacker terminal greens)
// - Banned promises or "free" in candidate tool pricing copy

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  path.join(ROOT_DIR, 'app/(admin)/command'),
  path.join(ROOT_DIR, 'components/admin'),
];

// 1. Emoji regex: matches pictorial emojis
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

// 2. Raw enums that should never be displayed directly to users in JSX
const BANNED_RAW_ENUMS = [
  'PLATFORM_ADMIN',
  'SUPER_ADMIN',
  'NEEDS_REVIEW',
  'RETAKE_REQUESTED',
  'VIDEO_REVIEWER',
  'FINANCE_ADMIN',
  'SUPPORT_ADMIN',
  'INGESTED',
];

function getAllFiles(dir, exts = ['.tsx', '.ts', '.jsx', '.js']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  return results;
}

const violations = [];
const allFiles = TARGET_DIRS.flatMap((d) => getAllFiles(d));

for (const file of allFiles) {
  const relPath = path.relative(ROOT_DIR, file);
  const content = fs.readFileSync(file, 'utf8');

  // Check 1: Emojis
  const emojiMatch = content.match(EMOJI_REGEX);
  if (emojiMatch) {
    violations.push({
      file: relPath,
      rule: 'NO_EMOJI',
      detail: `Found emoji "${emojiMatch[0]}" at position ${emojiMatch.index}`,
    });
  }

  // Check 2: Terminal styling in file classes
  if (/font-mono.*bg-black.*text-green/i.test(content) || /bg-gray-900.*text-emerald/i.test(content)) {
    violations.push({
      file: relPath,
      rule: 'NO_TERMINAL_STYLING',
      detail: 'Found terminal console styling classes (bg-black / font-mono / text-green)',
    });
  }

  // Check 3: Parse AST for TSX/JSX files to check user-visible text
  if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    function checkUserVisibleText(text, pos) {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Check for raw enums
      for (const bannedEnum of BANNED_RAW_ENUMS) {
        const regex = new RegExp(`\\b${bannedEnum}\\b`);
        if (regex.test(trimmed)) {
          const { line } = sf.getLineAndCharacterOfPosition(pos);
          violations.push({
            file: `${relPath}:${line + 1}`,
            rule: 'NO_RAW_ENUMS_IN_UI',
            detail: `Found raw enum "${bannedEnum}" rendered in UI text: "${trimmed}"`,
          });
        }
      }

      // Check for terminal prompts in JSX
      if (/^[$#]\s+[a-z]/i.test(trimmed) || /^~[$#]/.test(trimmed)) {
        const { line } = sf.getLineAndCharacterOfPosition(pos);
        violations.push({
          file: `${relPath}:${line + 1}`,
          rule: 'NO_TERMINAL_STYLING',
          detail: `Found terminal command prompt in UI text: "${trimmed}"`,
        });
      }

      // Check for forbidden word "free" in candidate tool pricing / description text
      if (/\bfree\b/i.test(trimmed) && (trimmed.toLowerCase().includes('candidate') || trimmed.toLowerCase().includes('interview') || trimmed.toLowerCase().includes('resume') || trimmed.toLowerCase().includes('tool'))) {
        const { line } = sf.getLineAndCharacterOfPosition(pos);
        violations.push({
          file: `${relPath}:${line + 1}`,
          rule: 'NO_UNVERIFIED_FREE_PROMISES',
          detail: `Found forbidden word "free" in tool copy: "${trimmed}"`,
        });
      }
    }

    function visit(node) {
      if (ts.isJsxText(node)) {
        checkUserVisibleText(node.getText(sf), node.getStart(sf));
      } else if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression)) {
        checkUserVisibleText(node.expression.text, node.expression.getStart(sf));
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }
}

console.log('--- SYNC730 COMMAND CENTER COMPLIANCE CHECK ---');
console.log(`Scanned ${allFiles.length} files across app/(admin)/command and components/admin.`);

if (violations.length > 0) {
  console.error(`\x1b[31mFAIL: Found ${violations.length} compliance violation(s):\x1b[0m`);
  violations.forEach((v, idx) => {
    console.error(`  ${idx + 1}. [${v.rule}] in ${v.file}: ${v.detail}`);
  });
  process.exit(1);
} else {
  console.log('\x1b[32mPASS: All files compliant. Zero emojis, zero raw enums in UI, zero terminal styling, zero banned phrases.\x1b[0m');
  process.exit(0);
}
