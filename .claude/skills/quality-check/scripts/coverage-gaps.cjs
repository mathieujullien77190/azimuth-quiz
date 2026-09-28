#!/usr/bin/env node
/**
 * Lists what `jest --coverage` leaves uncovered, per file (lines, branches, functions).
 *
 * Usage:
 *   npx jest --coverage --coverageReporters=json --coverageReporters=json-summary
 *   node .claude/skills/quality-check/scripts/coverage-gaps.cjs
 * Exit code 1 when anything is uncovered (the project's threshold is 100 %). Read-only.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const finalFile = path.join(ROOT, 'coverage', 'coverage-final.json');
const summaryFile = path.join(ROOT, 'coverage', 'coverage-summary.json');

if (!fs.existsSync(finalFile)) {
  console.error('No coverage/coverage-final.json: run `npx jest --coverage --coverageReporters=json --coverageReporters=json-summary` first.');
  process.exit(2);
}

const coverage = JSON.parse(fs.readFileSync(finalFile, 'utf8'));
let gaps = 0;
for (const [file, data] of Object.entries(coverage)) {
  const name = path.relative(ROOT, file).split(path.sep).join('/');
  const lines = [];
  for (const [id, hits] of Object.entries(data.s)) if (hits === 0) lines.push(`stmt L${data.statementMap[id].start.line}`);
  for (const [id, branches] of Object.entries(data.b)) {
    branches.forEach((hits, index) => {
      if (hits === 0) lines.push(`branch L${data.branchMap[id].locations[index]?.start?.line ?? data.branchMap[id].line} (${data.branchMap[id].type})`);
    });
  }
  for (const [id, hits] of Object.entries(data.f)) if (hits === 0) lines.push(`fn ${data.fnMap[id].name} L${data.fnMap[id].loc.start.line}`);
  if (lines.length > 0) {
    gaps += lines.length;
    console.log(`${name}\n   ${[...new Set(lines)].join('\n   ')}`);
  }
}

if (fs.existsSync(summaryFile)) {
  const total = JSON.parse(fs.readFileSync(summaryFile, 'utf8')).total;
  console.log(
    `\nTotal: statements ${total.statements.pct}% · branches ${total.branches.pct}% · functions ${total.functions.pct}% · lines ${total.lines.pct}%`,
  );
}
console.log(gaps === 0 ? 'Nothing uncovered.' : `${gaps} uncovered spot(s).`);
process.exit(gaps === 0 ? 0 : 1);
