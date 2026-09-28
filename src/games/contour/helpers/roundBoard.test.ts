import { flagEmoji } from '@/data/places/countries';
import type { ContourCountry } from '@/types';

import { buildHintLabels, projectRound } from './roundBoard';

// A 2:1 rectangle at the equator, so `boardDimensionsFor` keeps a predictable aspect ratio.
const country: ContourCountry = {
  code: 'FR',
  points: [
    [0, 0],
    [2, 0],
    [2, 1],
    [0, 1],
  ],
  neighbors: [
    { type: 'country', code: 'ES', x: 0.25, y: 0.75 },
    { type: 'country', code: 'DE', x: 0.5, y: 0.25 },
  ],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'easy',
};

describe('projectRound', () => {
  it('fits the board to the box while keeping the country aspect ratio', () => {
    const board = projectRound(country, 400, 400);
    expect(board.width).toBeCloseTo(400);
    expect(board.height).toBeCloseTo(200, 0);
    expect(board.country).toBe(country);
  });

  it('shrinks the width when the height is the limiting side', () => {
    const board = projectRound(country, 400, 100);
    expect(board.height).toBeCloseTo(100);
    expect(board.width).toBeCloseTo(200, 0);
  });

  it('projects one outline point per country point, inside the canvas', () => {
    const board = projectRound(country, 400, 400);
    expect(board.outline).toHaveLength(country.points.length);
    for (const point of board.outline) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(board.width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(board.height);
    }
  });

  it('scales the curated center and neighbor fractions to the canvas', () => {
    const board = projectRound(country, 400, 400);
    expect(board.centerPosition).toEqual({ x: board.width * 0.5, y: board.height * 0.5 });
    expect(board.neighborHints.map((hint) => hint.neighbor.code)).toEqual(['ES', 'DE']);
    expect(board.neighborHints[0].position).toEqual({ x: board.width * 0.25, y: board.height * 0.75 });
    expect(board.neighborHints[1].position).toEqual({ x: board.width * 0.5, y: board.height * 0.25 });
  });
});

describe('buildHintLabels', () => {
  const board = projectRound(country, 400, 400);
  const gap = Math.min(board.width, board.height) * 0.045;

  it('shows nothing before the first hint', () => {
    expect(buildHintLabels(board, 0, 'fr')).toEqual([]);
  });

  it('tier 1: only the neighbors flags', () => {
    const labels = buildHintLabels(board, 1, 'fr');
    expect(labels).toEqual([
      { position: board.neighborHints[0].position, icon: true, text: flagEmoji('ES') },
      { position: board.neighborHints[1].position, icon: true, text: flagEmoji('DE') },
    ]);
  });

  it('tier 2: adds the target flag at its curated spot', () => {
    const labels = buildHintLabels(board, 2, 'fr');
    expect(labels).toHaveLength(3);
    expect(labels[2]).toEqual({ position: board.centerPosition, icon: true, text: flagEmoji('FR') });
  });

  it('tier 3: stacks each neighbor name under its flag, in the requested language', () => {
    const fr = buildHintLabels(board, 3, 'fr');
    expect(fr).toHaveLength(5);
    const espagne = fr.find((label) => label.text === 'Espagne');
    expect(espagne?.position).toEqual({
      x: board.neighborHints[0].position.x,
      y: board.neighborHints[0].position.y + gap,
    });
    expect(buildHintLabels(board, 3, 'en').some((label) => label.text === 'Spain')).toBe(true);
  });

  it('tier 4: adds the target country name under its flag', () => {
    const labels = buildHintLabels(board, 4, 'fr');
    expect(labels).toHaveLength(6);
    expect(labels[5]).toEqual({
      position: { x: board.centerPosition.x, y: board.centerPosition.y + gap },
      text: 'France',
    });
  });
});
