import type { Theme } from '@/types';

import { FONT_FAMILY } from './fonts';

/** Sable chaud + bleu acier poussiere : palette de jour douce ; un accent bleu sourd reste lisible sur le sable et distinct de `danger`/`success`. */
export const day: Theme = {
  id: 'day',
  name: 'Jour',
  tagline: 'Sable et bleu ardoise',
  isDark: false,
  colors: {
    background: '#F3EEE3',
    surface: '#FFFFFF',
    surfaceHigh: '#FAF7F0',
    // Nettement plus sombre que surfaceHigh et la face de la boussole : sinon bordures de cartes et graduations (CompassDial) presque invisibles.
    border: '#C2B8A3',
    text: '#22262B',
    textMuted: '#5F6670',
    accent: '#5B88B4',
    accentDark: '#3E6A96',
    title: '#22262B',
    onAccent: '#FFFFFF',
    // Le point/fleche de la vraie reponse prend l'accent le jour (le violet de Night jurait avec sable/bleu).
    truth: '#5B88B4',
    danger: '#DC2626',
    success: '#16A34A',
  },
  radius: { sm: 10, md: 16, lg: 24, button: 999 },
  typography: {
    display: { fontFamily: FONT_FAMILY, fontWeight: '900', letterSpacing: -0.5 },
    heading: { fontFamily: FONT_FAMILY, fontWeight: '800' },
    label: { fontFamily: FONT_FAMILY, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    body: { fontFamily: FONT_FAMILY },
  },
  card: { borderWidth: 1, shadowColor: '#0F172A', shadowOpacity: 0.08 },
  buttonDepth: 4,
  compass: { faceInner: '#FAF7F0', faceOuter: '#FFFFFF' },
};
