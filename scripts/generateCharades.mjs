#!/usr/bin/env node
// Dev-only generation tool (`npm run generate:charades`) — NOT part of `npm test`, CI, or the
// shipped app in any other way than the JSON files it (may) write. Two jobs:
//
// 1) Every Clue place's syllable split is MANDATORY in `src/data/places/charadePlaces.json` (see
//    `data/places/codec.ts`'s doc comment) — nothing is ever computed live in the app. This
//    script's first job is to keep that invariant true: any key present in `cluesPlaces.json`
//    (a Clue place) but still missing from `charadePlaces.json` gets one filled in — the French
//    syllabifier heuristic below (this is its only copy: no shipped app code needs it, so it
//    lives only here rather than as a separate `src/` module) — and `charadePlaces.json` is
//    rewritten. A key already carrying a split (whether heuristic or hand-corrected) is left
//    untouched: correcting one is a hand edit directly on that key's line in
//    `charadePlaces.json`, not something this script would ever override.
//
// 2) `src/data/charade.json`, the riddle dictionary: COMPLETE — every syllable that appears on
//    ANY place's split is a key, its curated riddle (`scripts/charadeCuration.json`, a flat
//    `{ "syllable": "riddle" }` object, lowercase keys — there is no sensible algorithm for "a
//    French homophone of this sound", it takes a human/LLM with actual language judgment) or
//    `null` when nothing is curated for it yet. The charade clue is only offered for a place once
//    EVERY one of its syllables has a non-null riddle here (`charadeReady`, in
//    `helpers/charade.ts`) — this file is also the checklist of what's left to curate.
//
// Idempotent: re-running with nothing missing/changed rewrites both outputs to the exact same
// content.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cluesPlacesPath = path.join(rootDir, 'src/data/places/cluesPlaces.json');
const placesPath = path.join(rootDir, 'src/data/places/places.json');
const charadePlacesPath = path.join(rootDir, 'src/data/places/charadePlaces.json');
const riddleCurationPath = path.join(rootDir, 'scripts/charadeCuration.json');
const riddleOutputPath = path.join(rootDir, 'src/data/charade.json');

// --- Syllabifier — rough, heuristic ORTHOGRAPHIC (spelling-based, not phonetic) French
// syllabification: groups of vowel letters = one sound, cesura V-CV/VC-CV depending on 1 or 2+
// consonants between two groups, a nasal "n"/"m" folds into the vowel run before it unless
// doubled. Imperfect on rare cases, documented rather than chased for perfection — a rough split
// still works fine for the game (see `charadeLines`'s own fallback in `helpers/charade.ts`). -----

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

// --- 1) Top up any Clue place still missing its mandatory syllable split ----------------------

const cluesPlaces = JSON.parse(readFileSync(cluesPlacesPath, 'utf8'));
const places = JSON.parse(readFileSync(placesPath, 'utf8'));
const charadePlaces = JSON.parse(readFileSync(charadePlacesPath, 'utf8'));

let toppedUp = 0;
for (const key of Object.keys(cluesPlaces)) {
  if (key in charadePlaces) continue;
  const [name] = places[key];
  charadePlaces[key] = syllabify(name).map((s) => s.toLowerCase());
  toppedUp += 1;
}

if (toppedUp > 0) {
  const lines = Object.entries(charadePlaces).map(([k, v]) => '  ' + JSON.stringify(k) + ':' + JSON.stringify(v));
  writeFileSync(charadePlacesPath, '{\n' + lines.join(',\n') + '\n}\n', 'utf8');
  console.log(`Topped up ${toppedUp} place(s) missing their syllable split.`);
}

const realSyllables = new Set();
let totalSyllables = 0;
for (const syllables of Object.values(charadePlaces)) {
  syllables.forEach((s) => {
    realSyllables.add(normalize(s));
    totalSyllables += 1;
  });
}

// --- 2) Complete riddle dictionary, every real syllable a key ---------------------------------

const riddleCuration = (() => {
  try {
    return JSON.parse(readFileSync(riddleCurationPath, 'utf8'));
  } catch {
    console.log(`No ${riddleCurationPath} yet — no riddle will be curated.`);
    return {};
  }
})();

const curatedByNormalizedKey = {};
const riddleOrphaned = [];
const conflicts = [];
for (const [syllable, riddle] of Object.entries(riddleCuration)) {
  const normalized = normalize(syllable);
  if (normalized !== syllable) {
    console.log(`Riddle curation key "${syllable}" normalizes to "${normalized}" (case or à/â) — merged into it.`);
  }
  if (typeof riddle !== 'string' || riddle.trim() === '') continue;
  if (!realSyllables.has(normalized)) riddleOrphaned.push(syllable);
  if (curatedByNormalizedKey[normalized] !== undefined && curatedByNormalizedKey[normalized] !== riddle.trim()) {
    conflicts.push([normalized, curatedByNormalizedKey[normalized], riddle.trim()]);
  }
  curatedByNormalizedKey[normalized] = riddle.trim();
}

const riddleOutput = {};
for (const syllable of [...realSyllables].sort((a, b) => a.localeCompare(b, 'fr'))) {
  riddleOutput[syllable] = curatedByNormalizedKey[syllable] ?? null;
}
// One syllable per line (like the other data/places split files) — a single 18KB line was
// unreadable/undiffable by hand.
const riddleLines = Object.entries(riddleOutput).map(([k, v]) => '  ' + JSON.stringify(k) + ':' + JSON.stringify(v));
writeFileSync(riddleOutputPath, '{\n' + riddleLines.join(',\n') + '\n}\n', 'utf8');

// --- Summary ------------------------------------------------------------------------------

const curatedCount = Object.values(riddleOutput).filter((riddle) => riddle !== null).length;
console.log('--- generateCharades summary ---');
console.log(`Clue places: ${Object.keys(cluesPlaces).length}, ${totalSyllables} syllable occurrences, ${realSyllables.size} distinct.`);
console.log(`Syllables curated: ${curatedCount} / ${realSyllables.size} distinct (${((curatedCount / realSyllables.size) * 100).toFixed(1)}%).`);
if (riddleOrphaned.length > 0) {
  console.log(`Curated riddle keys matching no real syllable — likely a typo, kept anyway: ${riddleOrphaned.join(', ')}`);
}
if (conflicts.length > 0) {
  console.log('Riddle curation keys that normalize to the same syllable with DIFFERENT riddles (last one wins — review by hand):');
  for (const [k, first, second] of conflicts) console.log(`  "${k}": "${first}" vs "${second}"`);
}
