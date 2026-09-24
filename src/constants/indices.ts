import { decodeIndicesPlaces, type MergedPlaces } from '@/constants/places/codec';
import placesData from '@/constants/places/places.json';
import type { IndicesAnswerMethod, IndicesBuzzerMode, IndicesClueId, IndicesPlace, IndicesSettings } from '@/types';

// Jeu Indices : lieux dedies, sans rapport avec constants/places/ (Boussole) si ce n'est que les
// donnees de depart (nom/pays/coordonnees/difficulte) ont ete importees depuis CITIES la-bas, puis
// augmentees ici des champs propres a Indices (position, population, climat, altitude, fuseau
// horaire). Les couleurs de drapeau, le nom du pays et le nom generique de la devise sont partages
// avec Boussole (voir constants/places/countries.ts) : un pays n'a qu'un drapeau et qu'une devise,
// ca n'a rien d'Indices-specifique.

/**
 * Chaque lieu Indices est reconstruit depuis `places.json`, la source commune avec Boussole (voir
 * `src/constants/places/codec.ts`) : `decodeIndicesPlaces` associe chaque lieu commun a ses champs
 * propres a Indices (population, climat, altitude...). Les deux pools de lieux restent
 * independants (curation, taille et criteres differents), seules l'identite (nom/pays/coordonnees)
 * et — pour les lieux presents dans les deux jeux — les champs bruts sont partages.
 */
export const INDICES_PLACES: IndicesPlace[] = decodeIndicesPlaces(placesData as unknown as MergedPlaces);

// Ordre d'affichage dans la grille : du plus facile (cout le plus haut, en haut) au plus dur (cout
// 1, violet, en bas). Chaque manche affiche desormais tous les indices (plus de sous-ensemble) :
// cet ordre est donc l'ordre d'affichage complet, pas juste un tri visuel d'un tirage partiel.
export const INDICES_CLUE_ORDER: IndicesClueId[] = [
  'population',
  'localTime',
  'firstLetter',
  'bearing',
  'distance',
  'letterCount',
  'wordCount',
  'climate',
  'emoji',
  'flagColors',
  'position',
  'elevation',
  'airportCode',
  'currency',
  'phoneCode',
];

export const INDICES_BUZZER_MODES: { id: IndicesBuzzerMode }[] = [{ id: 'turnPlayer' }, { id: 'anyone' }];

export const INDICES_ANSWER_METHODS: { id: IndicesAnswerMethod }[] = [{ id: 'spoken' }, { id: 'typed' }];

export const DEFAULT_INDICES_SETTINGS: IndicesSettings = {
  playerNames: [''],
  difficulty: 'easy',
  buzzerMode: 'anyone',
  answerMethod: 'spoken',
  rounds: 5,
};
