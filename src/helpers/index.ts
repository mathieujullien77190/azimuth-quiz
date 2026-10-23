export { formatBearing, formatDistance, formatNumber, initials } from './utils';
export { bearingDeg, distanceKm, normalizeBearing } from './geo';
export { kmToRatio, ratioToKm } from './distanceScale';
export { resolveOrigin } from './platform';
export { applyBestBonus, scoreRound } from './scoring';
export {
  clearAppData,
  loadLanguage,
  loadPlayerName,
  loadSettings,
  loadThemeId,
  saveLanguage,
  savePlayerName,
  saveSettings,
  saveThemeId,
  systemLanguage,
} from './storage';
export { disableTextSelection, polyfillFlagEmoji } from './platform';
