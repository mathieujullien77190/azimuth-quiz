import { countryName } from '@/constants/places/countries';
import type { Category, Difficulty, IndicesPositionInCountry } from '@/types';

export const CATEGORY_ORDER: Category[] = ['cities', 'mountains', 'landmarks', 'nature', 'kids'];

export const CATEGORY_LABELS: Record<Category, string> = {
  cities: 'Villes',
  mountains: 'Montagnes',
  landmarks: 'Monuments',
  nature: 'Nature',
  kids: 'Enfants',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  cities: '#60A5FA',
  mountains: '#A78BFA',
  landmarks: '#F5B841',
  nature: '#4ADE80',
  kids: '#F472B6',
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard', 'master'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  intermediate: 'Intermédiaire',
  hard: 'Difficile',
  master: 'Maître',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#4ADE80',
  intermediate: '#F5B841',
  hard: '#FB923C',
  master: '#FF6B6B',
};

export const POSITION_ORDER: IndicesPositionInCountry[] = ['center', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export const POSITION_LABELS: Record<IndicesPositionInCountry, string> = {
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

export const countryFor = (code: string): string => countryName(code, 'fr');
