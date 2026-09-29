#!/usr/bin/env node
// Dev-only generation tool (`npm run generate:personalities`) — NOT part of `npm test`, CI, or the
// shipped app in any other way than the JSON file it writes. Rebuilds
// `src/data/personalities.json`, the Clues game's own "personality" clue data.
//
// Unlike `generateCharades.mjs`, there is nothing to compute here: a "real person genuinely tied
// to this place, per Wikipedia" is not something a script can derive, so this one only validates
// and copies `scripts/personalityCuration.json` (see that file's own header) into the shipped
// shape — keyed by `${code}|${name}`, same as `charades.json` — and reports coverage. A place
// with NOTHING in the curation file gets no entry at all: never a made-up name, see
// `helpers/personality.ts`'s own doc comment.
//
// Curation source: Wikipedia/Wikidata only, picked by hand (an LLM session, going through the
// place list, cross-checking the person's own Wikipedia page rather than inferring from the
// place name) — never invented. Re-run this script after editing the curation file.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const placesPath = path.join(rootDir, 'src/data/places/places.json');
const curationPath = path.join(rootDir, 'scripts/personalityCuration.json');
const outputPath = path.join(rootDir, 'src/data/personalities.json');

const entries = JSON.parse(readFileSync(placesPath, 'utf8'));

let curation = {};
try {
  curation = JSON.parse(readFileSync(curationPath, 'utf8'));
} catch {
  console.log(`No ${curationPath} yet — nothing to ship.`);
}

const key = (code, name) => `${code}|${name}`;
const knownKeys = new Set();
for (const [common, , clues] of entries) {
  if (!clues) continue;
  const [name, code] = common;
  knownKeys.add(key(code, name));
}

const output = {};
const orphaned = [];
for (const [placeKey, entry] of Object.entries(curation)) {
  if (!knownKeys.has(placeKey)) {
    orphaned.push(placeKey);
    continue;
  }
  output[placeKey] = { name: entry.name, description: entry.description ?? null };
}

const sorted = {};
for (const placeKey of Object.keys(output).sort()) sorted[placeKey] = output[placeKey];
writeFileSync(outputPath, JSON.stringify(sorted) + '\n', 'utf8');

console.log('--- generatePersonalities summary ---');
console.log(`Clue places total: ${knownKeys.size}`);
console.log(`Places with a curated personality: ${Object.keys(output).length}`);
console.log(`Places without one (not curated, or nothing reliable found): ${knownKeys.size - Object.keys(output).length}`);
if (orphaned.length > 0) {
  console.log(`Curated keys that no longer match a place in places.json (dropped): ${orphaned.join(', ')}`);
}
