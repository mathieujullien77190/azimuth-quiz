import type { Theme } from '@/types';

import { FONT_FAMILY } from './fonts';

/** Warm sand + dusty steel blue: a soft daytime palette. The sky blue, orange and wine tried before were all too
 * strong or too flashy; a muted blue accent stays readable as text on sand, and distinct from `danger` and `success`. */
export const day: Theme = {
  id: 'day',
  name: 'Jour',
  tagline: 'Sable et bleu ardoise',
  isDark: false,
  colors: {
    background: '#F3EEE3',
    surface: '#FFFFFF',
    surfaceHigh: '#FAF7F0',
    // Clearly darker than surfaceHigh and the compass face (both near-white sands): card outlines and the
    // compass's minor degree ticks (see CompassDial) would be nearly invisible with a paler border.
    border: '#C2B8A3',
    text: '#22262B',
    textMuted: '#5F6670',
    accent: '#5B88B4',
    accentDark: '#3E6A96',
    title: '#22262B',
    onAccent: '#FFFFFF',
    // The true-answer arrow/point uses the accent color by day (was Night's purple, which read
    // as an unrelated third color against the sand/blue Day palette).
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
