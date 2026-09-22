import type { Theme } from '@/types';

import { FONT_FAMILY } from './fonts';

/** Minimal : papier blanc, encre noire, accent et reponse dans le meme bleu marine. Presque sans arrondi. */
export const paper: Theme = {
  id: 'paper',
  name: 'Papier',
  tagline: 'Minimal, encre et bleu marine',
  isDark: false,
  colors: {
    background: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceHigh: '#F0F0EA',
    border: '#DAD9D2',
    text: '#111111',
    textMuted: '#6B6B66',
    accent: '#142959',
    accentDark: '#0C1938',
    onAccent: '#FFFFFF',
    // Meme couleur que l'accent : un seul bleu pour "ta reponse" et pour la vraie reponse.
    truth: '#142959',
    danger: '#E5484D',
    success: '#2E9E5B',
  },
  radius: { sm: 2, md: 4, lg: 6, button: 2 },
  typography: {
    display: { fontFamily: FONT_FAMILY, fontWeight: '700', letterSpacing: -1 },
    heading: { fontFamily: FONT_FAMILY, fontWeight: '700' },
    label: { fontFamily: FONT_FAMILY, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
    body: { fontFamily: FONT_FAMILY },
  },
  card: { borderWidth: 1, shadowColor: null, shadowOpacity: 0 },
  buttonDepth: 0,
  compass: { faceInner: '#FFFFFF', faceOuter: '#F0F0EA' },
};
