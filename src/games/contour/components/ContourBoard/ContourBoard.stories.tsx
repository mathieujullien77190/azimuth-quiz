import type { Meta, StoryObj } from '@storybook/react-vite';

import { flagEmoji, countryName } from '@/data/places/countries';
import {
  SAMPLE_CONTOUR_BOARD,
  SAMPLE_CONTOUR_BOARD_SIZE,
  SAMPLE_CONTOUR_CENTER_POSITION,
  SAMPLE_CONTOUR_COUNTRY,
  SAMPLE_CONTOUR_NEIGHBORS,
  SAMPLE_CONTOUR_OUTLINE,
} from '@/helpers/storyFixtures';

import { buildHintPlan } from '../../helpers/hintPlan';
import { boardShapeFor, buildHintLabels } from '../../helpers/roundBoard';
import { ContourBoard } from './ContourBoard';
import { source } from '@/storybook/source';
import allHintsRevealedCode from './AllHintsRevealed.source.md?raw';
import citiesAndCapitalCode from './CitiesAndCapital.source.md?raw';
import precisionLevelsCode from './PrecisionLevels.source.md?raw';
import withNeighborsCode from './WithNeighbors.source.md?raw';

const meta = {
  title: 'Silhouette/ContourBoard',
  component: ContourBoard,
} satisfies Meta<typeof ContourBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

// Silhouette hints only: level k of the outline is reached after k hints.
const SILHOUETTE_PLAN = buildHintPlan(['silhouette'], SAMPLE_CONTOUR_COUNTRY);
// City and capital hints only: positions first, then names.
const PLACES_PLAN = buildHintPlan(['cities', 'capital'], SAMPLE_CONTOUR_COUNTRY);

/** France's real outline (same source and simplification as every other country) with its curated
 * neighbors/centerLabel (see CLAUDE.md's Silhouette section), at every hint tier revealed at once: neighbor flags, the
 * target's own flag, and every neighbor name stacked under its icon. */
export const AllHintsRevealed: Story = {
  parameters: source(allHintsRevealedCode),
  args: {
    height: SAMPLE_CONTOUR_BOARD_SIZE.height,
    hintLabels: [
      ...SAMPLE_CONTOUR_NEIGHBORS.map(({ neighbor, position }) => ({
        position,
        text: flagEmoji(neighbor.code),
        icon: true,
      })),
      ...SAMPLE_CONTOUR_NEIGHBORS.map(({ neighbor, position }) => ({
        position,
        text: countryName(neighbor.code, 'fr'),
      })),
      { position: SAMPLE_CONTOUR_CENTER_POSITION, text: flagEmoji(SAMPLE_CONTOUR_COUNTRY.code), icon: true },
    ],
    outline: SAMPLE_CONTOUR_OUTLINE,
    width: SAMPLE_CONTOUR_BOARD_SIZE.width,
  },
};

/** The countries that touch France, filled discreetly behind it: the coast is the heavy line, and
 * each shared border (Spain, Belgium, Germany, Switzerland, Italy...) is a single thin line — the
 * neighbors themselves carry no stroke, so there is no double line. */
export const WithNeighbors: Story = {
  parameters: source(withNeighborsCode),
  args: {
    borders: SAMPLE_CONTOUR_BOARD.borders,
    coastlines: SAMPLE_CONTOUR_BOARD.coastlines,
    height: SAMPLE_CONTOUR_BOARD.height,
    neighborOutlines: SAMPLE_CONTOUR_BOARD.neighborOutlines,
    outline: SAMPLE_CONTOUR_BOARD.outline,
    width: SAMPLE_CONTOUR_BOARD.width,
  },
};

/** The same round at the four precision levels a hint refines one after the other (France, one
 * fixed seed): a handful of segments, then more, then more, then the full ring. Every level shares
 * the full ring's frame, so the shape only ever gains detail; neighbors are only drawn on the full
 * ring (see the previous story), since their shared edges only line up on it. */
export const PrecisionLevels: Story = {
  parameters: source(precisionLevelsCode),
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {[0, 1, 2, 3].map((level) => (
        <div key={level}>
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            niveau {level} — {SAMPLE_CONTOUR_BOARD.precisionOutlines[level].length - 1} sommets
          </div>
          <ContourBoard
            height={SAMPLE_CONTOUR_BOARD.height}
            width={SAMPLE_CONTOUR_BOARD.width}
            {...boardShapeFor(SAMPLE_CONTOUR_BOARD, SILHOUETTE_PLAN, level)}
          />
        </div>
      ))}
    </div>
  ),
  args: {
    height: SAMPLE_CONTOUR_BOARD.height,
    outline: SAMPLE_CONTOUR_BOARD.outline,
    width: SAMPLE_CONTOUR_BOARD.width,
  },
};

/** The cities and the capital as hints: the positions first (a dot per city, a star for the capital), then
 * each name under its marker. France's capital and its best-known cities, on the full ring. */
export const CitiesAndCapital: Story = {
  parameters: source(citiesAndCapitalCode),
  args: {
    ...boardShapeFor(SAMPLE_CONTOUR_BOARD, PLACES_PLAN, 0),
    height: SAMPLE_CONTOUR_BOARD.height,
    hintLabels: buildHintLabels(SAMPLE_CONTOUR_BOARD, PLACES_PLAN, 4, 'fr'),
    width: SAMPLE_CONTOUR_BOARD.width,
  },
};
