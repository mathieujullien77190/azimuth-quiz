import { bearingToCardinal, normalizeBearing } from './geo';

const NARROW_NBSP = ' ';

export const formatNumber = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP);

export const formatDistance = (km: number): string => `${formatNumber(km)}${NARROW_NBSP}km`;

export const formatBearing = (degrees: number, cardinals: readonly string[]): string =>
  `${bearingToCardinal(degrees, cardinals)} · ${Math.round(normalizeBearing(degrees)) % 360}°`;

export const formatInclination = (degrees: number): string => `${Math.round(degrees)}°`;

/** A player's initials: the first 2 letters of their name, uppercase. */
export const initials = (name: string): string => name.trim().slice(0, 2).toUpperCase();
