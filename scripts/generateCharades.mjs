#!/usr/bin/env node
// Dev-only generation tool (`npm run generate:charades`) — NOT part of `npm test`, CI, or the
// shipped app in any other way than the JSON files it writes. Rebuilds TWO files:
// - `src/data/charade.json`: the riddle dictionary, GLOBAL, keyed by the syllable's own text
//   (lowercased) rather than by place — curating "pa" once gives every place with a "pa"
//   syllable the same riddle, instead of re-curating the same syllable separately for each place
//   that happens to have it (Paris, Palerme...). Curated by hand in `scripts/charadeCuration.json`
//   (a flat `{ "syllable": "riddle" }` object, lowercase keys) — there is no sensible algorithm
//   for "a French homophone of this sound", it takes a human (or an LLM) with actual language
//   judgment.
// - `src/data/charadeSyllables.json`: per-place overrides of the syllable SPLIT itself — every
//   place computes it live by default (the heuristic French syllabifier ported here by hand from
//   `src/games/clues/helpers/syllabify.ts`, since this script runs under plain Node ESM with no
//   build step — same reasoning as `generateContours.mjs` porting its own board math, keep the two
//   in sync by hand if that file's rules ever change), an override only exists where a human has
//   added/removed/renamed a syllable by hand — `scripts/charadeSyllablesCuration.json`
//   (`{ "code|name": ["syllable", ...] }`, lowercase).
//
// Idempotent and safe to re-run after adding a place to `places.json` or editing either curation
// file: it always rebuilds both outputs from these inputs, never edits either curation file.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const placesPath = path.join(rootDir, 'src/data/places/places.json');
const riddleCurationPath = path.join(rootDir, 'scripts/charadeCuration.json');
const syllablesCurationPath = path.join(rootDir, 'scripts/charadeSyllablesCuration.json');
const riddleOutputPath = path.join(rootDir, 'src/data/charade.json');
const syllablesOutputPath = path.join(rootDir, 'src/data/charadeSyllables.json');

// --- Syllabifier — ported by hand from src/games/clues/helpers/syllabify.ts ------------------

const VOWEL_LETTERS = new Set([...'aeiouyâäàéèêëîïôöûüùœ']);
const isVowel = (char) => VOWEL_LETTERS.has(char.toLowerCase());
const isNasal = (char) => char.toLowerCase() === 'n' || char.toLowerCase() === 'm';

const vowelSpans = (word) => {
  const spans = [];
  let i = 0;
  while (i < word.length) {
    if (!isVowel(word[i])) {
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end < word.length && isVowel(word[end])) end += 1;
    if (end < word.length && isNasal(word[end])) {
      const after = word[end + 1];
      const doubled = after !== undefined && after.toLowerCase() === word[end].toLowerCase();
      if (!doubled && (after === undefined || !isVowel(after))) end += 1;
    }
    spans.push({ start: i, end });
    i = end;
  }
  return spans;
};

const syllabifyWord = (word) => {
  const spans = vowelSpans(word);
  if (spans.length === 0) return [word];
  const starts = [0];
  for (let s = 1; s < spans.length; s += 1) {
    const gap = spans[s].start - spans[s - 1].end;
    starts.push(spans[s - 1].end + (gap >= 2 ? 1 : 0));
  }
  return starts.map((start, index) => word.slice(start, starts[index + 1] ?? word.length));
};

const syllabify = (name) => {
  const words = name.split(/[\s'’-]+/).filter((word) => word.length > 0);
  const syllables = words.flatMap(syllabifyWord);
  return syllables.length > 0 ? syllables : [name];
};

// Ported by hand from src/games/clues/helpers/charade.ts's own `normalizeSyllable` — keep the two
// in sync. Case-insensitive, and folds "à"/"â" onto "a" (true homophones in French, unlike the
// "e" family — "e"/"é"/"è" are genuinely different sounds, left alone on purpose).
const normalize = (syllable) => syllable.toLowerCase().replace(/[àâ]/g, 'a');

// --- Load inputs ------------------------------------------------------------------------------

const entries = JSON.parse(readFileSync(placesPath, 'utf8'));

const loadJson = (filePath, whatFor) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    console.log(`No ${filePath} yet — ${whatFor}.`);
    return {};
  }
};

const riddleCuration = loadJson(riddleCurationPath, 'no riddle will be curated');
const syllablesCuration = loadJson(syllablesCurationPath, 'every place uses its heuristic split');

const key = (code, name) => `${code}|${name}`;

// --- Places' own syllables (override when curated, heuristic otherwise), and every real
// syllable across all of them, normalized — used to report riddle curation keys that don't (or no
// longer) match anything real, likely a typo. -------------------------------------------------

const syllablesOutput = {};
const syllablesOrphaned = [];
const realSyllables = new Set();
let placeCount = 0;
let totalSyllables = 0;
for (const [common, , clues] of entries) {
  if (!clues) continue; // Compass-only place: not a Clue place.
  const [name, code] = common;
  placeCount += 1;
  const placeKey = key(code, name);
  const curated = syllablesCuration[placeKey];
  const syllables = (curated ?? syllabify(name)).map((s) => s.toLowerCase());
  if (curated) syllablesOutput[placeKey] = syllables;
  syllables.forEach((s) => {
    realSyllables.add(normalize(s));
    totalSyllables += 1;
  });
}
for (const placeKey of Object.keys(syllablesCuration)) {
  const [code, ...nameParts] = placeKey.split('|');
  const name = nameParts.join('|');
  if (!entries.some(([common, , clues]) => clues && common[0] === name && common[1] === code)) {
    syllablesOrphaned.push(placeKey);
  }
}

const sortedSyllables = {};
for (const placeKey of Object.keys(syllablesOutput).sort()) sortedSyllables[placeKey] = syllablesOutput[placeKey];
writeFileSync(syllablesOutputPath, JSON.stringify(sortedSyllables) + '\n', 'utf8');

// --- Riddle dictionary, validated against the real (possibly overridden) syllables above ------

const riddleOutput = {};
const riddleOrphaned = [];
const conflicts = [];
for (const [syllable, riddle] of Object.entries(riddleCuration)) {
  const normalized = normalize(syllable);
  if (normalized !== syllable) {
    console.log(`Riddle curation key "${syllable}" normalizes to "${normalized}" (case or à/â) — merged into it.`);
  }
  if (typeof riddle !== 'string' || riddle.trim() === '') continue;
  if (!realSyllables.has(normalized)) riddleOrphaned.push(syllable);
  if (riddleOutput[normalized] !== undefined && riddleOutput[normalized] !== riddle.trim()) {
    conflicts.push([normalized, riddleOutput[normalized], riddle.trim()]);
  }
  riddleOutput[normalized] = riddle.trim();
}

const sortedRiddles = {};
for (const syllable of Object.keys(riddleOutput).sort((a, b) => a.localeCompare(b, 'fr'))) sortedRiddles[syllable] = riddleOutput[syllable];
writeFileSync(riddleOutputPath, JSON.stringify(sortedRiddles) + '\n', 'utf8');

// --- Summary ------------------------------------------------------------------------------

console.log('--- generateCharades summary ---');
console.log(`Clue places: ${placeCount}, ${totalSyllables} syllable occurrences, ${realSyllables.size} distinct.`);
console.log(`Places with a hand-corrected syllable split: ${Object.keys(sortedSyllables).length}.`);
console.log(`Syllables curated: ${Object.keys(sortedRiddles).length} / ${realSyllables.size} distinct (${((Object.keys(sortedRiddles).length / realSyllables.size) * 100).toFixed(1)}%).`);
if (syllablesOrphaned.length > 0) {
  console.log(`Syllable-split curation keys matching no place (likely renamed/removed): ${syllablesOrphaned.join(', ')}`);
}
if (riddleOrphaned.length > 0) {
  console.log(`Curated riddle keys matching no real syllable — likely a typo, kept anyway: ${riddleOrphaned.join(', ')}`);
}
if (conflicts.length > 0) {
  console.log('Riddle curation keys that normalize to the same syllable with DIFFERENT riddles (last one wins — review by hand):');
  for (const [k, first, second] of conflicts) console.log(`  "${k}": "${first}" vs "${second}"`);
}
