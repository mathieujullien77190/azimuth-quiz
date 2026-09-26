import { countryName, flagEmoji } from '@/constants/places/countries';
import type { ContourNeighbor } from '@/types';

/**
 * Icon/name for a curated neighbor — mirrors ContourGameScreen/helpers.ts's own
 * `neighborIcon`/`neighborName`, kept as small local copies rather than imported directly: that
 * module pulls in the main app's top-level `@/constants` barrel (theme/RN-dependent), which isn't
 * safe to bundle into this plain-React admin app (see ContourEditor.tsx's own note on
 * `@/components/ContourBoard/helpers`).
 */
export const neighborIcon = (neighbor: ContourNeighbor): string => flagEmoji(neighbor.code);

export const neighborName = (neighbor: ContourNeighbor): string => countryName(neighbor.code, 'fr');
