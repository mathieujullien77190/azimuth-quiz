import type { Theme } from '@/types';

import { FONT_FAMILY } from './fonts';

/** Sky blue + orange: a daytime sky instead of stars (see ThemeBackdrop, which switches to
 * drifting clouds when `isDark` is false). A true orange accent rather than Night's amber —
 * amber/yellow washes out against the light blue background. */
export const day: Theme = {
  id: 'day',
  name: 'Jour',
  tagline: 'Ciel bleu et nuages',
  isDark: false,
  colors: {
    background: '#CFEBFA',
    surface: '#FFFFFF',
    surfaceHigh: '#E7F5FC',
    // Darker/more saturated than the original pale blue (#B9DDEE): that one barely stood out
    // against surfaceHigh or the compass face (both light blues too) — card outlines and the
    // compass's minor degree ticks (see CompassDial) were nearly invisible.
    border: '#7FA3BD',
    text: '#132033',
    textMuted: '#4C6178',
    accent: '#F97316',
    accentDark: '#C2410C',
    onAccent: '#1A1203',
    truth: '#7C3AED',
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
  compass: { faceInner: '#E7F5FC', faceOuter: '#FFFFFF' },
};
