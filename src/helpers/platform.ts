import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import * as Location from 'expo-location';
import { Platform, type ViewStyle } from 'react-native';

import { DEFAULT_ORIGIN, LOCATION_TIMEOUT_MS } from '@/data';
import type { Origin } from '@/types';

const STYLE_ID = 'azimuthquiz-no-select';

/** Le pilote natif des animations n'existe pas sur le web (react-native-web) : y demander `useNativeDriver` journalise un avertissement. */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** Sur le web, glisser sur la boussole ou les curseurs selectionne du texte : desactive sauf dans les champs. Sans effet sur mobile. */
export const disableTextSelection = (): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(STYLE_ID) !== null) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
    input, textarea { -webkit-user-select: text; user-select: text; }
  `;
  document.head.appendChild(style);
};

/**
 * Chromium sous Windows n'a pas de police pour les drapeaux emoji (il affiche le code a 2 lettres) : le polyfill
 * injecte une petite webfont ("Twemoji Country Flags", `FLAG_FONT_FAMILY`) seulement si besoin.
 */
export const polyfillFlagEmoji = (): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  polyfillCountryFlagEmojis();
};

/**
 * Vue qui garde le toucher sur le web (la page ne defile ni ne zoome sous le doigt, ex. le globe 3D). `touchAction`
 * est du CSS passe par react-native-web, d'ou le cast ; sur mobile react-native avertirait du style inconnu.
 */
export const noPageScroll = (): ViewStyle | undefined =>
  Platform.OS === 'web' ? ({ touchAction: 'none' } as unknown as ViewStyle) : undefined;

/** Emoji drapeau d'un code ISO 3166-1 alpha-2 ("FR" -> 🇫🇷). Exige `FLAG_FONT_FAMILY` (themes/fonts.ts)
 * a l'affichage : Chromium sous Windows n'a pas de police systeme pour les drapeaux. */
export const flagEmoji = (code: string): string =>
  code
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join('');

type BackRouter = { canGoBack: () => boolean; back: () => void; replace: (href: '/') => void };

/** Un pas en arriere, ou l'accueil sans historique (page ouverte sur une route profonde, web) : `back()` y leve une erreur GO_BACK. */
export const goBackOrHome = (router: BackRouter): void => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};

const fetchDeviceOrigin = async (deviceOriginName: string): Promise<Origin> => {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return DEFAULT_ORIGIN;

  const position =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

  return {
    name: deviceOriginName,
    coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
    isDevicePosition: true,
  };
};

/**
 * Position de l'appareil comme point de depart, ou Paris si refusee, indisponible
 * ou trop lente (permission en attente, pas de signal GPS...). `deviceOriginName` est le nom
 * affiche pour cette position (traduit dans la langue courante).
 */
export const resolveOrigin = async (deviceOriginName: string): Promise<Origin> => {
  const timeout = new Promise<Origin>((resolve) => setTimeout(() => resolve(DEFAULT_ORIGIN), LOCATION_TIMEOUT_MS));
  try {
    return await Promise.race([fetchDeviceOrigin(deviceOriginName), timeout]);
  } catch {
    return DEFAULT_ORIGIN;
  }
};
