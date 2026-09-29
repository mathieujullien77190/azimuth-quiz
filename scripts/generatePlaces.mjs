#!/usr/bin/env node
// Dev-only generation tool (`npm run generate:places`) — NOT part of `npm test`, CI, or the
// shipped app in any other way than the JSON file it writes. Compiles the readable
// `scripts/placesSource.json` (named fields: name/code/coordinates/difficulty +
// compass{category,description,wikiFr,wikiEn}|null + clues{...}|null) into the compact
// `src/data/places/places.json` the app actually imports — an array of
// `[common, compass, clues]` positional tuples, decoded back by `src/data/places/codec.ts`
// (see that file's own doc comment). Editing `places.json` directly still works (it's the
// same shape it always was), but `placesSource.json` is the one meant for hand-editing:
// named fields instead of counting array positions.
//
// Category/difficulty/timezone codes (`src/data/places/codes.json`) are shared with `codec.ts`.
// Timezone codes are append-only: reusing an existing zone's code would silently reassign it,
// corrupting every place already using it. A timezone not yet in the table gets the next free
// 2-letter code, appended (never inserted alphabetically, never reusing a freed code) — codes.json
// is rewritten when that happens, so the new code is stable from then on.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(rootDir, 'scripts/placesSource.json');
const codesPath = path.join(rootDir, 'src/data/places/codes.json');
const placesOutputPath = path.join(rootDir, 'src/data/places/places.json');

const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const codes = JSON.parse(readFileSync(codesPath, 'utf8'));

const nextTimezoneCode = (used) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  for (const a of alphabet) {
    for (const b of alphabet) {
      const code = a + b;
      if (!used.has(code)) return code;
    }
  }
  throw new Error('Out of 2-letter timezone codes.');
};

const usedTimezoneCodes = new Set(Object.values(codes.timezone));
let newTimezones = 0;

const encodeTimezone = (tz) => {
  const existing = codes.timezone[tz];
  if (existing !== undefined) return existing;
  const code = nextTimezoneCode(usedTimezoneCodes);
  usedTimezoneCodes.add(code);
  codes.timezone[tz] = code;
  newTimezones += 1;
  console.log(`New timezone "${tz}" -> "${code}" (appended to codes.json).`);
  return code;
};

const encodeCompass = (compass) => {
  if (!compass) return null;
  const categoryCode = codes.category[compass.category];
  if (categoryCode === undefined) throw new Error(`Unknown category "${compass.category}".`);
  return [categoryCode, compass.description ?? null, compass.wikiFr ?? null, compass.wikiEn ?? null];
};

const encodeClues = (clues) => {
  if (!clues) return null;
  const row = [
    clues.positionInCountry,
    clues.population,
    clues.climateEmoji,
    clues.elevationMeters,
    encodeTimezone(clues.timezone),
    clues.airportCode,
    ...clues.emojis,
  ];
  if (clues.syllables !== null && clues.syllables !== undefined) row.push(clues.syllables);
  return row;
};

const encoded = source.map((entry) => {
  const difficultyCode = codes.difficulty[entry.difficulty];
  if (difficultyCode === undefined) throw new Error(`Unknown difficulty "${entry.difficulty}" for "${entry.name}".`);
  const common = [entry.name, entry.code, entry.latitude, entry.longitude, difficultyCode];
  return [common, encodeCompass(entry.compass), encodeClues(entry.clues)];
});

const lines = encoded.map((row) => '  ' + JSON.stringify(row));
writeFileSync(placesOutputPath, '[\n' + lines.join(',\n') + '\n]\n', 'utf8');

if (newTimezones > 0) {
  writeFileSync(codesPath, JSON.stringify(codes, null, 2) + '\n', 'utf8');
}

console.log('--- generatePlaces summary ---');
console.log(`Places: ${encoded.length}.`);
if (newTimezones > 0) console.log(`New timezone codes appended: ${newTimezones}.`);
