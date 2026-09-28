import type { ThemeId } from '@/types';

import type { ColorToken } from './types';

/** Every color a theme defines, in the order a designer reads them: canvas, text, accent, feedback. */
export const COLOR_TOKENS: ColorToken[] = [
  {
    name: 'colors.background',
    get: (theme) => theme.colors.background,
    description: { fr: 'Fond de l’écran (ciel de nuit ou de jour)', en: 'Screen background (night or day sky)' },
  },
  {
    name: 'colors.surface',
    get: (theme) => theme.colors.surface,
    description: { fr: 'Cartes et panneaux', en: 'Cards and panels' },
  },
  {
    name: 'colors.surfaceHigh',
    get: (theme) => theme.colors.surfaceHigh,
    description: {
      fr: 'Champs, pied de page du jeu, silhouette du pays',
      en: 'Fields, the game footer, the country silhouette',
    },
  },
  {
    name: 'colors.border',
    get: (theme) => theme.colors.border,
    description: {
      fr: 'Contours, séparateurs, bouton secondaire (nuit)',
      en: 'Outlines, dividers, secondary button (night)',
    },
  },
  {
    name: 'colors.text',
    get: (theme) => theme.colors.text,
    description: { fr: 'Texte principal', en: 'Main text' },
  },
  {
    name: 'colors.textMuted',
    get: (theme) => theme.colors.textMuted,
    description: { fr: 'Texte secondaire, indications', en: 'Secondary text, hints' },
  },
  {
    name: 'colors.accent',
    get: (theme) => theme.colors.accent,
    description: {
      fr: 'Couleur de marque : titres, bouton principal, sélection',
      en: 'Brand color: titles, primary button, selection',
    },
  },
  {
    name: 'colors.accentDark',
    get: (theme) => theme.colors.accentDark,
    description: { fr: 'Épaisseur du bouton principal', en: 'Depth of the primary button' },
  },
  {
    name: 'colors.onAccent',
    get: (theme) => theme.colors.onAccent,
    description: { fr: 'Texte posé sur l’accent', en: 'Text laid over the accent' },
  },
  {
    name: 'colors.truth',
    get: (theme) => theme.colors.truth,
    description: {
      fr: 'La vérité : aiguille et point de la bonne réponse',
      en: 'The truth: the right answer’s needle and mark',
    },
  },
  {
    name: 'colors.danger',
    get: (theme) => theme.colors.danger,
    description: { fr: 'Erreur, perte de points, expulsion', en: 'Error, lost points, kicking a player' },
  },
  {
    name: 'colors.success',
    get: (theme) => theme.colors.success,
    description: { fr: 'Réussite, difficulté facile', en: 'Success, easy difficulty' },
  },
  {
    name: 'compass.faceInner',
    get: (theme) => theme.compass.faceInner,
    description: { fr: 'Centre du cadran de la boussole', en: 'Centre of the compass dial' },
  },
  {
    name: 'compass.faceOuter',
    get: (theme) => theme.compass.faceOuter,
    description: { fr: 'Bord du cadran de la boussole', en: 'Edge of the compass dial' },
  },
];

export const THEME_LABELS: Record<ThemeId, { fr: string; en: string }> = {
  night: { fr: 'Nuit', en: 'Night' },
  day: { fr: 'Jour', en: 'Day' },
};

export const COPY = {
  fr: { title: 'Couleurs du thème', token: 'Couleur', current: 'thème actuel' },
  en: { title: 'Theme colors', token: 'Color', current: 'current theme' },
};
