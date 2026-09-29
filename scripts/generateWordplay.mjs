#!/usr/bin/env node
// Dev-only generation tool (`npm run generate:wordplay`) — NOT part of `npm test`, CI, or the
// shipped app in any other way than the JSON file it writes. Rebuilds
// `src/data/wordplay.json`, the Clues game's own "wordplay" clue data.
//
// A genuine pun on a place's name is not something a script can invent, so this one only
// validates and copies `scripts/wordplayCuration.json` into the shipped shape — keyed the same
// short way as `places.json`'s own sibling files (`"par"` for Paris, see `data/places/codec.ts`'s
// doc comment) — and reports coverage. A place with nothing (or an empty `sentence`) in the
// curation file gets no entry: never a made-up or blank clue, see `helpers/wordplay.ts`'s own doc
// comment.
//
// Curation source: by hand only — `sentence` is the pun itself, `difficulty` ('easy'/'intermediate'
// /'hard') how tricky it is to get, defaults to 'intermediate' when missing/invalid. Re-run this
// script after editing the curation file.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cluesPlacesPath = path.join(rootDir, 'src/data/places/cluesPlaces.json');
const curationPath = path.join(rootDir, 'scripts/wordplayCuration.json');
const outputPath = path.join(rootDir, 'src/data/wordplay.json');

const cluesPlaces = JSON.parse(readFileSync(cluesPlacesPath, 'utf8'));
const knownKeys = new Set(Object.keys(cluesPlaces));

let curation = {};
try {
  curation = JSON.parse(readFileSync(curationPath, 'utf8'));
} catch {
  console.log(`No ${curationPath} yet — nothing to ship.`);
}

const VALID_DIFFICULTIES = new Set(['easy', 'intermediate', 'hard']);

const output = {};
const orphaned = [];
const blank = [];
for (const [key, entry] of Object.entries(curation)) {
  if (!knownKeys.has(key)) {
    orphaned.push(key);
    continue;
  }
  const sentence = (entry.sentence ?? '').trim();
  if (sentence === '') {
    blank.push(key);
    continue;
  }
  const difficulty = VALID_DIFFICULTIES.has(entry.difficulty) ? entry.difficulty : 'intermediate';
  output[key] = { sentence, difficulty };
}

const sorted = {};
for (const key of Object.keys(output).sort()) sorted[key] = output[key];
writeFileSync(outputPath, JSON.stringify(sorted) + '\n', 'utf8');

console.log('--- generateWordplay summary ---');
console.log(`Clue places total: ${knownKeys.size}`);
console.log(`Places with a curated wordplay: ${Object.keys(output).length}`);
console.log(`Places without one (not curated, or left blank): ${knownKeys.size - Object.keys(output).length}`);
if (orphaned.length > 0) {
  console.log(`Curated keys that no longer match a Clue place (dropped): ${orphaned.join(', ')}`);
}
if (blank.length > 0) {
  console.log(`Curated keys with an empty sentence (dropped): ${blank.join(', ')}`);
}
