#!/usr/bin/env node
/**
 * Structure audit: every component/screen folder against the project's conventions (CLAUDE.md,
 * "Structure" and "Storybook"), and every story file against the Storybook conventions.
 *
 * Usage: node .claude/skills/quality-check/scripts/audit-structure.cjs [--json]
 * Exit code 1 when a problem is found. Read-only.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const ROOTS = [
  'src/components',
  'src/games/compass/components',
  'src/games/clues/components',
  'src/games/contour/components',
  'src/games/compass/screens',
  'src/games/clues/screens',
  'src/games/contour/screens',
];

/**
 * Folders that legitimately have no story: smart containers (routes, providers, screens that read a
 * store or the router) — the convention is "a dumb component has a story, a smart container doesn't".
 * Anything NOT listed here must have one. Keep the reason next to the name.
 */
const NO_STORY_OK = {
  HomeScreen: 'smart container (router, storage)',
  SettingsScreen: 'smart container (settings stores)',
  LanguageProvider: 'provider',
  ThemeProvider: 'provider',
  RoomDeletedScreen: 'reads the router',
  useSetupRoom: 'hook, not a component',
  HelicopterButton: 'shown through MascotButton',
  UfoButton: 'shown through MascotButton',
  SetupScreen: 'smart container',
  EndScreen: 'container of FinalStandings',
  OnlineGameScreen: 'smart container',
  ClueSetupScreen: 'smart container',
  OnlineClueGameScreen: 'smart container',
  ContourSetupScreen: 'smart container',
  OnlineContourGameScreen: 'smart container',
};

/** Folders that are not components: no `<Name>.tsx` is expected. */
const NOT_A_COMPONENT = new Set(['useSetupRoom']);

const problems = [];
const problem = (where, message) => problems.push({ where, message });
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');

// ---- storySort roots (admin/.storybook/preview.tsx)
const preview = read(path.join(ROOT, 'admin/.storybook/preview.tsx'));
const orderMatch = preview.match(/order:\s*\[([^\]]*)\]/);
const STORY_ROOTS = orderMatch ? [...orderMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];

// ---- collect component folders
const folders = [];
const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);
  const isMain = (f) => /^[A-Z][A-Za-z0-9]*\.tsx$/.test(f) && !/\.(test|stories)\.tsx$/.test(f);
  if (files.some(isMain) || files.includes('index.ts')) folders.push({ dir, name: path.basename(dir), files });
  for (const e of entries) if (e.isDirectory()) walk(path.join(dir, e.name));
};
for (const r of ROOTS) {
  const abs = path.join(ROOT, r);
  if (!fs.existsSync(abs)) continue;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) if (e.isDirectory()) walk(path.join(abs, e.name));
}

for (const { dir, name, files } of folders) {
  const where = rel(dir);
  const main = `${name}.tsx`;
  const has = (f) => files.includes(f);
  const skipComponent = NOT_A_COMPONENT.has(name);

  if (!skipComponent) {
    if (!has('index.ts')) problem(where, 'no index.ts');
    if (!has(main)) problem(where, `no ${main}`);
    if (has('index.ts') && !/as default|export default/.test(read(path.join(dir, 'index.ts')))) {
      problem(where, 'index.ts must re-export the component as default (`export { X as default } from ...`)');
    }
  }

  if (has(main)) {
    const src = read(path.join(dir, main));
    const stylesFile = files.find((f) => f === 'styles.ts' || f.endsWith('.styles.ts'));
    if (/createStyles|useThemedStyles/.test(src) && !stylesFile) problem(where, 'styles used but no styles.ts');
    if (!new RegExp(`export const ${name}\\b|export function ${name}\\b`).test(src)) {
      problem(where, `${main} must have a named export \`${name}\``);
    }
    if (/export default/.test(src)) problem(where, `${main} has a default export: only index.ts re-exports as default`);
    if (/StyleSheet\.create/.test(src)) problem(where, `${main} calls StyleSheet.create: styles belong in styles.ts`);
    if (/useThemedStyles\(\s*\(/.test(src)) problem(where, 'useThemedStyles needs a module-level createStyles (stable identity)');
    if (/\bProps\b/.test(src) && !has('types.ts')) problem(where, 'props are typed but there is no types.ts');
    if (/from '\.\.\/\.\.\/\.\.\//.test(src)) problem(where, 'deep relative import (use the @/ alias)');
    if (/from 'firebase\//.test(src) && /\/index\.ts$/.test(main)) problem(where, 'firebase imported from a barrel');
  }

  if (!skipComponent && !files.some((f) => /\.test\.tsx?$/.test(f))) problem(where, 'no colocated test');

  const stories = files.filter((f) => f.endsWith('.stories.tsx'));
  if (stories.length === 0 && !NO_STORY_OK[name]) {
    problem(where, 'no story (a dumb component needs one; if it is a smart container, add it to NO_STORY_OK)');
  }
  if (stories.length > 0 && NO_STORY_OK[name]) problem(where, `has a story but is listed in NO_STORY_OK (${NO_STORY_OK[name]})`);
}

// ---- story files (anywhere under src)
const storyFiles = [];
const findStories = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findStories(p);
    else if (e.name.endsWith('.stories.tsx')) storyFiles.push(p);
  }
};
findStories(path.join(ROOT, 'src'));

for (const file of storyFiles) {
  const where = rel(file);
  const text = read(file);
  const dir = path.dirname(file);

  const title = text.match(/title:\s*'([^']+)'/)?.[1];
  if (!title) problem(where, 'no title');
  else if (STORY_ROOTS.length > 0 && !STORY_ROOTS.includes(title.split('/')[0])) {
    problem(where, `title root "${title.split('/')[0]}" is missing from storySort (${STORY_ROOTS.join(', ')})`);
  }

  // `source()` goes on each story, never on the meta (the CSF plugin would drop it)
  const meta = text.match(/const meta = \{[\s\S]*?\} satisfies Meta/)?.[0] ?? '';
  if (/source\(/.test(meta)) problem(where, '`source()` is on the meta: put it on each story');

  const storyCount = [...text.matchAll(/export const \w+: Story\b/g)].length;
  const sourceCount = [...text.matchAll(/parameters:\s*(\{[^}]*)?source\(/g)].length;
  if (storyCount > 0 && sourceCount < storyCount) {
    problem(where, `${storyCount} stories but only ${sourceCount} with \`parameters: source(...)\``);
  }

  for (const m of text.matchAll(/from '\.\/([^']+\.source\.md)\?raw'/g)) {
    const md = path.join(dir, m[1]);
    if (!fs.existsSync(md)) problem(where, `imports missing ${m[1]}`);
    else if (!/^\s*```tsx\s*\n/.test(read(md))) problem(rel(md), 'must start with a ```tsx fence');
  }
}

// ---- .source.md nobody imports
const seenMd = new Set();
for (const file of storyFiles) {
  const dir = path.dirname(file);
  if (seenMd.has(dir)) continue;
  seenMd.add(dir);
  const stories = fs.readdirSync(dir).filter((f) => f.endsWith('.stories.tsx'));
  const texts = stories.map((f) => read(path.join(dir, f))).join('\n');
  for (const md of fs.readdirSync(dir).filter((f) => f.endsWith('.source.md'))) {
    if (!texts.includes(md)) problem(rel(path.join(dir, md)), 'not imported by any story');
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(problems, null, 2));
} else {
  const byPlace = new Map();
  for (const { where, message } of problems) byPlace.set(where, [...(byPlace.get(where) ?? []), message]);
  for (const [where, messages] of byPlace) console.log(`${where}\n${messages.map((m) => `   - ${m}`).join('\n')}`);
  console.log(
    `\n${folders.length} component folders and ${storyFiles.length} story files checked: ${problems.length} problem(s).`,
  );
}
process.exit(problems.length > 0 ? 1 : 0);
