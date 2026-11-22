// scripts/tests/check-emojis.mjs
import { execSync } from 'child_process';

const diff = execSync('git diff', { encoding: 'utf8' });
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}]/gu;
const addedLines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
const emojisFound = [];
for (const line of addedLines) {
  const matches = line.match(emojiRegex);
  if (matches) emojisFound.push({ line, matches });
}
if (emojisFound.length > 0) {
  console.error('EMOJIS FOUND IN DIFF:', JSON.stringify(emojisFound, null, 2));
  process.exit(1);
} else {
  console.log('PASS: Zero emojis found in git diff.');
}
