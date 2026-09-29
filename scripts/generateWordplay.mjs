#!/usr/bin/env node
// Dev-only generation tool (`npm run generate:wordplay`) — NOT part of `npm test`, CI, or the
// shipped app in any other way than the JSON file it writes. Rebuilds
// `src/data/wordplay.json`, the Clues game's own "wordplay" clue data.
//
// A genuine pun on a place's name is not something a script can invent, so this one only
// validates and copies `scripts/wordplayCuration.json` into the shipped shape — keyed by
// `${code}|${name}` — and reports coverage. A place with nothing (or an empty `sentence`) in the
// curation file gets no entry: never a made-up or blank clue, see `helpers/wordplay.ts`'s own doc
// comment. Unlike `personality` (now baked directly into `places.json`, see `codec.ts`), wordplay
// still lives in its own curation file / shipped `wordplay.json`.
//
// Curation source: by hand only — `sentence` is the pun itself, `explained` is (usually) the same
// sentence with the punning word(s) wrapped in `+plus+` signs (see `highlightSegments`), e.g.
// `"sentence": "Ce lac est +Constance+ dans son affection."` Re-run this script after editing the
// curation file.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const placesPath = path.join(rootDir, 'src/data/places/places.json');
const cluesPlacesPath = path.join(rootDir, 'src/data/places/cluesPlaces.json');
const curationPath = path.join(rootDir, 'scripts/wordplayCuration.json');
const outputPath = path.join(rootDir, 'src/data/wordplay.json');

const places = JSON.parse(readFileSync(placesPath, 'utf8'));
const cluesPlaces = JSON.parse(readFileSync(cluesPlacesPath, 'utf8'));

let curation = {};
try {
  curation = JSON.parse(readFileSync(curationPath, 'utf8'));
} catch {
  console.log(`No ${curationPath} yet — nothing to ship.`);
}

// `code|name`, NOT the short storage key the 5 place files share — wordplay's curation stays
// human-typed by hand (see this file's own doc comment), so it keeps the readable key.
const key = (code, name) => `${code}|${name}`;
const knownKeys = new Set();
for (const placeKey of Object.keys(cluesPlaces)) {
  const [name, code] = places[placeKey];
  knownKeys.add(key(code, name));
}

const output = {};
const orphaned = [];
const blank = [];
for (const [placeKey, entry] of Object.entries(curation)) {
  if (!knownKeys.has(placeKey)) {
    orphaned.push(placeKey);
    continue;
  }
  const sentence = (entry.sentence ?? '').trim();
  if (sentence === '') {
    blank.push(placeKey);
    continue;
  }
  output[placeKey] = { sentence, explained: (entry.explained ?? '').trim() };
}

const sorted = {};
for (const placeKey of Object.keys(output).sort()) sorted[placeKey] = output[placeKey];
writeFileSync(outputPath, JSON.stringify(sorted) + '\n', 'utf8');

console.log('--- generateWordplay summary ---');
console.log(`Clue places total: ${knownKeys.size}`);
console.log(`Places with a curated wordplay: ${Object.keys(output).length}`);
console.log(`Places without one (not curated, or left blank): ${knownKeys.size - Object.keys(output).length}`);
if (orphaned.length > 0) {
  console.log(`Curated keys that no longer match a place in places.json (dropped): ${orphaned.join(', ')}`);
}
if (blank.length > 0) {
  console.log(`Curated keys with an empty sentence (dropped): ${blank.join(', ')}`);
}
