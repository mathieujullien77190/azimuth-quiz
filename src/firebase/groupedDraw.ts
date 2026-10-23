import { and, collection, getDocs, or, query, where } from 'firebase/firestore';

import type { Group, Numbering, Slot } from '@/firebase/numbering';
import { COLLECTIONS, DIFFICULTY_ORDER, DRAW_PER_ROUND_WITH_BUMP, IN_LIMIT } from '@/firebase/constants';
import type { Counts, PlaceDoc } from '@/firebase/types';
import type { Category, Difficulty } from '@/types';

import { db } from './client';
import type { Cursors } from '@/helpers/groupCursors';
import { shuffle, splitEvenly } from '@/helpers/utils';

// Hors du barrel de `helpers/index.ts` : `firebase/firestore` est ESM seul et fait planter Jest.

const groupKey = ({ category, difficulty }: Pick<Group, 'category' | 'difficulty'>): string =>
  `${category}|${difficulty}`;

/** Un lieu lu dans Firestore, avec le groupe et le `n` de sa lecture. */
type Drawn<T> = { item: T; slot: Slot };

/** Parcours d'un groupe : depuis son curseur (aleatoire la 1re fois), une position apres l'autre, en bouclant. */
type Walk = { key: string; group: Group; size: number; start: number; taken: number };

const remaining = (walks: Walk[]): number => walks.reduce((sum, walk) => sum + walk.size - walk.taken, 0);

const takeFrom = (walk: Walk): Slot => {
  const n = ((walk.start + walk.taken) % walk.size) + 1;
  walk.taken += 1;
  return { ...walk.group, n };
};

/**
 * Les `count` prochains lieux (moins si les groupes manquent), repartis au plus egal entre les categories
 * (`splitEvenly`), puis entre les difficultes d'une categorie (deux en anglais).
 */
const takeSlots = (walks: Walk[], count: number): Slot[] => {
  const byCategory = [...new Set(walks.map((walk) => walk.group.category))].map((category) =>
    walks.filter((walk) => walk.group.category === category),
  );
  const perCategory = splitEvenly(
    count,
    byCategory.map((group) => remaining(group)),
  );
  return byCategory.flatMap((group, index) =>
    splitEvenly(
      perCategory[index],
      group.map((walk) => walk.size - walk.taken),
    ).flatMap((taken, position) => Array.from({ length: taken }, () => takeFrom(group[position]))),
  );
};

/** Ce qu'un jeu branche sur le tirage : numerotation, conversion document -> lieu, filtre. */
export type GroupedDrawOptions<T> = {
  numbering: Numbering;
  categoryField: string;
  numberField: string;
  counts: Counts;
  cursors: Cursors;
  saveCursors: (moved: Cursors) => void;
  categories: Category[];
  /** Difficultes stockees lues : `[difficulty]`, plus celle du dessous si refiltrage. */
  tiers: Difficulty[];
  rounds: number;
  toItem: (data: PlaceDoc, id: string) => T;
  /** Filtre ce qui a ete lu (relevement anglais). */
  keep: (item: T) => boolean;
};

/**
 * Tire les lieux d'une partie : Firestore n'a pas de requete "N documents au hasard", donc les lieux sont numerotes
 * 1..taille par groupe (`firebase/numbering.ts`) et chaque groupe a un curseur local qui avance en bouclant.
 * Une requete `or` par tranche de 30 ; une passe de plus (taille doublee) si des lieux manquent ou sont filtres.
 *
 * Rejette s'il existe moins de `rounds` lieux : curseurs intacts.
 */
export const drawFromGroups = async <T>(options: GroupedDrawOptions<T>): Promise<T[]> => {
  const { numbering, categoryField, numberField, counts, cursors, categories, tiers, rounds, toItem, keep } = options;
  const walks: Walk[] = categories
    .flatMap((category) => tiers.map((tier) => ({ category, difficulty: tier })))
    .map((group) => ({ group, size: counts[group.category]?.[group.difficulty] ?? 0 }))
    .filter(({ size }) => size > 0)
    .map(({ group, size }) => {
      const key = groupKey(group);
      return { key, group, size, start: (cursors[key] ?? Math.floor(Math.random() * size)) % size, taken: 0 };
    });
  const total = remaining(walks);
  if (total < rounds) throw new Error(`Not enough places for this game (${total} found, ${rounds} needed)`);

  /**
   * Lit les emplacements donnes avec UNE requete par tranche de 30, tous groupes confondus ; un emplacement sans
   * document (lieu retire depuis la lecture des tailles) manque simplement.
   */
  const readSlots = async (slots: Slot[]): Promise<Drawn<T>[]> => {
    const places = collection(db, COLLECTIONS.places);
    const queries = Array.from({ length: Math.ceil(slots.length / IN_LIMIT) }, (_, chunk) => {
      const byGroup = new Map<
        string,
        { category: Slot['category']; difficulty: Slot['difficulty']; numbers: number[] }
      >();
      for (const { category, difficulty, n } of slots.slice(chunk * IN_LIMIT, (chunk + 1) * IN_LIMIT)) {
        const id = groupKey({ category, difficulty });
        if (!byGroup.has(id)) byGroup.set(id, { category, difficulty, numbers: [] });
        byGroup.get(id)!.numbers.push(n);
      }
      const clauses = [...byGroup.values()].map(({ category, difficulty, numbers }) =>
        and(
          where(categoryField, '==', category),
          where('difficulty', '==', difficulty),
          where(numberField, 'in', numbers),
        ),
      );
      return getDocs(query(places, clauses.length === 1 ? clauses[0] : or(...clauses)));
    });
    return (await Promise.all(queries)).flatMap((snapshot) => {
      const drawn = snapshot.docs.map((document) => {
        const data = document.data() as PlaceDoc;
        const group = numbering.groupOf(data)!;
        return {
          id: document.id,
          data,
          item: toItem(data, document.id),
          slot: { ...group, n: numbering.numberOf(data)! },
        };
      });
      return drawn.map(({ item, slot }) => ({ item, slot }));
    });
  };

  const candidates: Drawn<T>[] = [];
  for (let pass = 1; candidates.length < rounds && remaining(walks) > 0; pass += 1) {
    const slots = takeSlots(walks, rounds * (tiers.length > 1 ? DRAW_PER_ROUND_WITH_BUMP : 1) * 2 ** (pass - 1));
    const read = await readSlots(slots);
    candidates.push(...read.filter(({ item }) => keep(item)));
  }
  if (candidates.length < rounds)
    throw new Error(`Not enough places for this game (${candidates.length} found, ${rounds} needed)`);

  // Tout lieu pris compte comme parcouru, marge non gardee comprise.
  options.saveCursors(
    Object.fromEntries(
      walks.filter((walk) => walk.taken > 0).map((walk) => [walk.key, (walk.start + walk.taken) % walk.size]),
    ),
  );
  return shuffle(
    shuffle(candidates)
      .slice(0, rounds)
      .map(({ item }) => item),
  );
};

/** Difficultes stockees qui peuvent s'afficher en `difficulty` apres le relevement anglais (un lieu francais monte d'un cran). */
export const storedTiers = (difficulty: Difficulty, language: 'fr' | 'en'): Difficulty[] => {
  const below = DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(difficulty) - 1];
  return language === 'en' && below ? [difficulty, below] : [difficulty];
};
