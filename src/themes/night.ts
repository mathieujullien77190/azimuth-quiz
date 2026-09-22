import type { Theme } from '@/types';

/** Bleu nuit + ambre : le design d'origine. Arrondis genereux, textes tres gras. */
export const night: Theme = {
  id: 'night',
  name: 'Nuit',
  tagline: 'Bleu nuit et ambre',
  isDark: true,
  colors: {
    background: '#0B1220',
    surface: '#141E33',
    surfaceHigh: '#1B2842',
    border: '#25334F',
    text: '#F3F6FC',
    textMuted: '#93A0BC',
    accent: '#F5B841',
    accentDark: '#C98A12',
    onAccent: '#1A1203',
    truth: '#FACC15',
    danger: '#FF6B6B',
    success: '#4ADE80',
  },
  radius: { sm: 10, md: 16, lg: 24, button: 999 },
  typography: {
    display: { fontWeight: '900', letterSpacing: -0.5 },
    heading: { fontWeight: '800' },
    label: { fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    body: {},
  },
  card: { borderWidth: 1, shadowColor: null, shadowOpacity: 0 },
  buttonDepth: 4,
  compass: { faceInner: '#1B2842', faceOuter: '#0B1220' },
};
