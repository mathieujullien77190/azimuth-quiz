import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Connect, type Plugin } from 'vite';

import {
  decodeBoussolePlace,
  decodeIndicesPlace,
  encodeBoussoleRow,
  encodeCommonRow,
  encodeIndicesRow,
  serializeMergedPlaces,
  type MergedPlaces,
  type PlaceEntry,
} from '../src/constants/places/codec';
import { decodeCountry, encodeCountry, serializeCountries, type CountryRow } from '../src/constants/places/countries';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const placesPath = path.resolve(rootDir, '../src/constants/places/places.json');
const countriesPath = path.resolve(rootDir, '../src/constants/places/countries.json');
const DIFFICULTIES = ['easy', 'intermediate', 'hard'];
const CATEGORIES = ['cities', 'capital', 'mountains', 'landmarks', 'nature', 'kids'];
const POSITIONS = ['center', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const FLAG_COLOR_IDS = ['red', 'blue', 'white', 'green', 'yellow', 'black'];

const requiredString = (value: unknown, label: string): string => {
  const trimmed = String(value).trim();
  if (!trimmed) throw new Error(`${label} ne peut pas être vide`);
  return trimmed;
};

const requiredNumber = (value: unknown, label: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${label} doit être un nombre`);
  return n;
};

const readEntries = (): PlaceEntry[] => JSON.parse(readFileSync(placesPath, 'utf-8'));

/** Small local API: reads/writes `places.json` directly, no database for a
 * single-user tool. Mounted on `/api/places` by the Vite dev server, absent from the build. `GET`
 * returns the raw file (one place per `[common, boussole, indices]` entry): the frontend decodes
 * it itself with the same `decodeBoussolePlace`/`decodeIndicesPlace` as both games, no
 * duplication. */
const placesApi = (): Plugin => ({
  name: 'places-api',
  configureServer(server) {
    server.middlewares.use('/api/places', (req: Connect.IncomingMessage, res, next) => {
      if (req.method === 'GET' && req.url === '/') {
        res.setHeader('Content-Type', 'application/json');
        res.end(readFileSync(placesPath, 'utf-8'));
        return;
      }

      const idMatch = (req.method === 'PUT' || req.method === 'DELETE') && req.url?.match(/^\/(\d+)$/);
      if (!idMatch) {
        next();
        return;
      }

      if (req.method === 'DELETE') {
        try {
          const index = Number(idMatch[1]);
          const entries = readEntries();
          if (!entries[index]) throw new Error('Lieu introuvable');

          entries.splice(index, 1);
          writeFileSync(placesPath, serializeMergedPlaces(entries as MergedPlaces));

          res.statusCode = 204;
          res.end();
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }));
        }
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const index = Number(idMatch[1]);
          const patch = JSON.parse(body);

          const entries = readEntries();
          const [commonRow, boussoleRow, indicesRow] = entries[index] ?? [];
          if (!commonRow) throw new Error('Lieu introuvable');

          if ('common' in patch) {
            if ('difficulty' in patch.common) {
              if (!DIFFICULTIES.includes(patch.common.difficulty)) throw new Error('Difficulte invalide');
              const newCommon = encodeCommonRow(commonRow, patch.common.difficulty);

              entries[index] = [newCommon, boussoleRow, indicesRow];
              writeFileSync(placesPath, serializeMergedPlaces(entries as MergedPlaces));
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  boussole: boussoleRow ? decodeBoussolePlace(newCommon, boussoleRow) : null,
                  indices: indicesRow ? decodeIndicesPlace(newCommon, indicesRow) : null,
                }),
              );
              return;
            }

            throw new Error('Requete invalide : "difficulty" attendu dans "common"');
          }

          if ('boussole' in patch) {
            if (!boussoleRow) throw new Error("Ce lieu n'est pas dans le pool Boussole");
            const place = { ...decodeBoussolePlace(commonRow, boussoleRow) };

            if ('category' in patch.boussole) {
              if (!CATEGORIES.includes(patch.boussole.category)) throw new Error('Categorie invalide');
              place.category = patch.boussole.category;
            }
            if ('description' in patch.boussole) {
              const value = String(patch.boussole.description).trim();
              if (value) place.description = value;
              else delete place.description;
            }

            entries[index] = [commonRow, encodeBoussoleRow(place), indicesRow];
            writeFileSync(placesPath, serializeMergedPlaces(entries as MergedPlaces));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(place));
            return;
          }

          if ('indices' in patch) {
            if (!indicesRow) throw new Error("Ce lieu n'est pas dans le pool Indices");
            const place = { ...decodeIndicesPlace(commonRow, indicesRow) };

            if ('positionInCountry' in patch.indices) {
              if (!POSITIONS.includes(patch.indices.positionInCountry)) throw new Error('Position invalide');
              place.positionInCountry = patch.indices.positionInCountry;
            }
            if ('population' in patch.indices) {
              place.population = requiredNumber(patch.indices.population, 'Population');
            }
            if ('elevationMeters' in patch.indices) {
              place.elevationMeters = requiredNumber(patch.indices.elevationMeters, 'Altitude');
            }
            if ('climateEmoji' in patch.indices) {
              place.climateEmoji = requiredString(patch.indices.climateEmoji, 'Climat');
            }
            if ('timezone' in patch.indices) {
              place.timezone = requiredString(patch.indices.timezone, 'Fuseau horaire');
            }
            if ('airportCode' in patch.indices) {
              place.airportCode = requiredString(patch.indices.airportCode, 'Aéroport');
            }
            if ('emojis' in patch.indices) {
              const emojis = patch.indices.emojis;
              if (!Array.isArray(emojis) || emojis.length !== 3 || emojis.some((e: unknown) => !String(e).trim())) {
                throw new Error('Les 3 emojis sont requis');
              }
              place.emojis = emojis as [string, string, string];
            }

            entries[index] = [commonRow, boussoleRow, encodeIndicesRow(place)];
            writeFileSync(placesPath, serializeMergedPlaces(entries as MergedPlaces));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(place));
            return;
          }

          throw new Error('Requete invalide : "boussole" ou "indices" attendu');
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }));
        }
      });
    });
  },
});

/** Same idea as `placesApi` for `countries.json`: `GET` returns the raw file, `PUT`
 * edits a country (fr/en name, flag, currency, phone code) — no deletion, a country is
 * never "surplus". */
const countriesApi = (): Plugin => ({
  name: 'countries-api',
  configureServer(server) {
    server.middlewares.use('/api/countries', (req: Connect.IncomingMessage, res, next) => {
      if (req.method === 'GET' && req.url === '/') {
        res.setHeader('Content-Type', 'application/json');
        res.end(readFileSync(countriesPath, 'utf-8'));
        return;
      }

      const codeMatch = req.method === 'PUT' && req.url?.match(/^\/([A-Z]{2})$/);
      if (!codeMatch) {
        next();
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const code = codeMatch[1];
          const patch = JSON.parse(body);

          const countries: Record<string, CountryRow> = JSON.parse(readFileSync(countriesPath, 'utf-8'));
          const row = countries[code];
          if (!row) throw new Error('Pays introuvable');
          const entry = decodeCountry(row);

          if ('fr' in patch) entry.fr = requiredString(patch.fr, 'Nom (FR)');
          if ('en' in patch) entry.en = requiredString(patch.en, 'Nom (EN)');
          if ('currency' in patch) entry.currency = patch.currency ? requiredString(patch.currency, 'Devise') : null;
          if ('currencySymbol' in patch) entry.currencySymbol = patch.currencySymbol ? requiredString(patch.currencySymbol, 'Symbole') : null;
          if ('phoneCode' in patch) entry.phoneCode = patch.phoneCode ? requiredString(patch.phoneCode, 'Indicatif') : null;
          if ('flag' in patch) {
            const flag = patch.flag;
            if (flag !== null) {
              if (!Array.isArray(flag) || flag.length === 0) throw new Error('Le drapeau doit avoir au moins une couleur');
              for (const row of flag) {
                if (!Array.isArray(row) || row.length !== 3) throw new Error('Ligne de drapeau invalide');
                const [colorId, hex, percent] = row;
                if (!FLAG_COLOR_IDS.includes(colorId)) throw new Error(`Couleur invalide : ${colorId}`);
                if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) throw new Error(`Hex invalide : ${hex}`);
                if (!Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error(`Pourcentage invalide : ${percent}`);
              }
            }
            entry.flag = flag;
          }

          countries[code] = encodeCountry(entry);
          writeFileSync(countriesPath, serializeCountries(countries));

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ code, ...entry }));
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }));
        }
      });
    });
  },
});

export default defineConfig({
  plugins: [react(), placesApi(), countriesApi()],
  resolve: {
    alias: { '@': path.resolve(rootDir, '../src') },
  },
  server: {
    fs: { allow: [path.resolve(rootDir, '..')] },
  },
});
