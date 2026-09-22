import type { Theme } from '@/types';

/** Minimal : papier blanc, encre noire, accent et reponse en bleu. Presque sans arrondi. */
export const paper: Theme = {
  id: 'paper',
  name: 'Papier',
  tagline: 'Minimal, encre et bleu',
  isDark: false,
  colors: {
    background: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceHigh: '#F0F0EA',
    border: '#DAD9D2',
    text: '#111111',
    textMuted: '#6B6B66',
    accent: '#2563EB',
    accentDark: '#1D4ED8',
    onAccent: '#FFFFFF',
    truth: '#0EA5E9',
    danger: '#E5484D',
    success: '#2E9E5B',
  },
  radius: { sm: 2, md: 4, lg: 6, button: 2 },
  typography: {
    display: { fontWeight: '700', letterSpacing: -1 },
    heading: { fontWeight: '700' },
    label: { fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
    body: {},
  },
  card: { borderWidth: 1, shadowColor: null, shadowOpacity: 0 },
  buttonDepth: 0,
  compass: { faceInner: '#FFFFFF', faceOuter: '#F0F0EA' },
};
