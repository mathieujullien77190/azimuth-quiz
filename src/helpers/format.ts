import { bearingToCardinal, normalizeBearing } from './geo';

const NARROW_NBSP = ' ';

export const formatNumber = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP);

export const formatDistance = (km: number): string => `${formatNumber(km)}${NARROW_NBSP}km`;

export const formatBearing = (degrees: number): string =>
  `${bearingToCardinal(degrees)} · ${Math.round(normalizeBearing(degrees)) % 360}°`;

export const formatInclination = (degrees: number): string =>
  degrees < 1 ? 'à l’horizon' : `${Math.round(degrees)}° sous l’horizon`;

/** Emoji drapeau a partir d'un code pays ISO 3166-1 alpha-2. */
export const countryCodeToFlag = (code: string): string =>
  String.fromCodePoint(...code.toUpperCase().split('').map((char) => 0x1f1a5 + char.charCodeAt(0)));

/** Initiales d'un joueur : les 2 premieres lettres de son nom, en majuscules. */
export const initials = (name: string): string => name.trim().slice(0, 2).toUpperCase();
