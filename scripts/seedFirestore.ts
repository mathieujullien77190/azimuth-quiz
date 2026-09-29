/**
 * One-shot import of the bundled game data into Firestore (phase 1: only the admin reads it).
 *
 *   npm run seed:firestore -- --dry-run   # counts per collection, writes nothing
 *   npm run seed:firestore                # writes; refuses a collection that already has documents
 *   npm run seed:firestore -- --force     # overwrites documents by id (erases admin edits!)
 *
 * Credentials: a Firebase service account key, from GOOGLE_APPLICATION_CREDENTIALS or
 * `scripts/serviceAccount.json` (git-ignored — never commit it).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cert, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { buildCountryDocs, buildJobDocs, buildPlaceDocs, buildRiddleDocs } from '../src/data/firestore/build';
import { COLLECTIONS, DATA_VERSION_DOC } from '../src/data/firestore/types';

const BATCH_SIZE = 400;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');

const collections: Record<string, Record<string, object>> = {
  [COLLECTIONS.places]: buildPlaceDocs(),
  [COLLECTIONS.countries]: buildCountryDocs(),
  [COLLECTIONS.charadeRiddles]: buildRiddleDocs(),
  [COLLECTIONS.personalityJobs]: buildJobDocs(),
};

for (const [name, docs] of Object.entries(collections)) {
  console.log(`${name}: ${Object.keys(docs).length} documents`);
}

if (dryRun) {
  console.log('--dry-run : rien écrit.');
  process.exit(0);
}

const keyFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'serviceAccount.json');
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  initializeApp({ credential: applicationDefault() });
} else if (existsSync(keyFile)) {
  initializeApp({ credential: cert(JSON.parse(readFileSync(keyFile, 'utf8'))) });
} else {
  console.error('Clé de compte de service introuvable : GOOGLE_APPLICATION_CREDENTIALS ou scripts/serviceAccount.json.');
  process.exit(1);
}
const db = getFirestore();

const run = async () => {
  if (!force) {
    for (const name of Object.keys(collections)) {
      const existing = await db.collection(name).limit(1).get();
      if (!existing.empty) {
        console.error(`La collection « ${name} » n'est pas vide : utilise --force pour écraser (efface les modifications faites dans l'admin).`);
        process.exit(1);
      }
    }
  }

  for (const [name, docs] of Object.entries(collections)) {
    const entries = Object.entries(docs);
    for (let start = 0; start < entries.length; start += BATCH_SIZE) {
      const batch = db.batch();
      for (const [id, doc] of entries.slice(start, start + BATCH_SIZE)) batch.set(db.collection(name).doc(id), doc);
      await batch.commit();
    }
    console.log(`${name}: ${entries.length} documents écrits`);
  }

  await db.collection(DATA_VERSION_DOC.collection).doc(DATA_VERSION_DOC.id).set({ version: 1, updatedAt: Date.now() });
  console.log('meta/dataVersion écrit.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
