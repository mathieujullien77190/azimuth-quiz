import { CATEGORIES } from '@/games/compass/constants';
import type { Category, Difficulty, CluePositionInCountry } from '@/types';

export const CATEGORY_ORDER: Category[] = ['cities', 'capital', 'citiesFr', 'mountains', 'landmarks', 'nature', 'kids'];

export const CATEGORY_LABELS: Record<Category, string> = {
  cities: 'Villes',
  capital: 'Capitales',
  citiesFr: 'Villes FR',
  mountains: 'Montagnes',
  landmarks: 'Monuments',
  nature: 'Nature',
  kids: 'Enfants',
};

export const CATEGORY_EMOJIS: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.emoji]),
) as Record<Category, string>;

// citiesFr uses a distinctly different hue from cities (warm orange vs. cool blue) so a French
// city can never be mistaken for a "regular" one at a glance.
export const CATEGORY_COLORS: Record<Category, string> = {
  cities: '#60A5FA',
  capital: '#FBBF24',
  citiesFr: '#FB923C',
  mountains: '#A78BFA',
  landmarks: '#F5B841',
  nature: '#4ADE80',
  kids: '#F472B6',
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  intermediate: 'Moyen',
  hard: 'Difficile',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#4ADE80',
  intermediate: '#F5B841',
  hard: '#FF6B6B',
};

export const POSITION_LABELS: Record<CluePositionInCountry, string> = {
  center: 'Centre',
  n: 'Nord',
  s: 'Sud',
  e: 'Est',
  w: 'Ouest',
  ne: 'Nord-Est',
  nw: 'Nord-Ouest',
  se: 'Sud-Est',
  sw: 'Sud-Ouest',
};
