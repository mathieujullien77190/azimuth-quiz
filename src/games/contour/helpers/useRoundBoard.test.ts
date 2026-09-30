import { act, renderHook } from '@testing-library/react-native';
import type { LayoutChangeEvent } from 'react-native';

import { spacing } from '@/data';
import type { ContourCountry, ContourRoundCountry } from '@/types';

import { useRoundBoard } from './useRoundBoard';

const country: ContourRoundCountry = {
  code: 'FR',
  fr: 'France',
  en: 'France',
  capital: null,
  cities: [],
  points: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ],
  neighbors: [],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'easy',
};

const layout = (width: number, height: number) =>
  ({ nativeEvent: { layout: { x: 0, y: 0, width, height } } }) as LayoutChangeEvent;

const neighbor: ContourCountry = {
  code: 'ES',
  points: [
    [1, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 0],
  ],
  neighbors: [],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'easy',
};

describe('useRoundBoard', () => {
  it('draws the countries around it as the backdrop (they come with the round)', async () => {
    const closed = { ...country, points: [...country.points, country.points[0]] };
    const { result } = await renderHook(() => useRoundBoard(closed, false, 0, [neighbor]));
    expect(result.current.board.neighborOutlines).toHaveLength(1);
    expect(result.current.board.borders.length).toBeGreaterThan(0);
  });

  it('starts from a placeholder box before anything is measured', async () => {
    const { result } = await renderHook(() => useRoundBoard(country, true));
    expect(result.current.board.width).toBeGreaterThan(0);
    expect(result.current.board.width).toBeLessThanOrEqual(280 - spacing.sm * 2);
    expect(result.current.board.height).toBeLessThanOrEqual(280 - spacing.sm * 2);
  });

  it('refits the board to the measured area, minus the margin on each side', async () => {
    const { result } = await renderHook(() => useRoundBoard(country, false));
    await act(async () => result.current.onBoardAreaLayout(layout(500, 300)));
    // Square country: the height (300 - 2 margins) is the limiting side.
    expect(result.current.board.height).toBeCloseTo(300 - spacing.sm * 2);
    expect(result.current.board.width).toBeCloseTo(300 - spacing.sm * 2, 0);
  });

  it('keeps the same board when the same size is measured again', async () => {
    const { result } = await renderHook(() => useRoundBoard(country, false));
    await act(async () => result.current.onBoardAreaLayout(layout(500, 300)));
    const before = result.current.board;
    await act(async () => result.current.onBoardAreaLayout(layout(500, 300)));
    expect(result.current.board).toBe(before);
  });

  it('subtracts the floating header and footer heights from a full-bleed board', async () => {
    const { result } = await renderHook(() => useRoundBoard(country, true));
    await act(async () => result.current.onBoardAreaLayout(layout(500, 400)));
    await act(async () => result.current.onOverlayTopLayout(layout(500, 50)));
    await act(async () => result.current.onOverlayBottomLayout(layout(500, 70)));
    expect(result.current.board.height).toBeCloseTo(400 - spacing.sm * 2 - 120);
  });

  it('ignores the overlays when the board is not full-bleed', async () => {
    const { result } = await renderHook(() => useRoundBoard(country, false));
    await act(async () => result.current.onBoardAreaLayout(layout(500, 400)));
    await act(async () => result.current.onOverlayTopLayout(layout(500, 50)));
    await act(async () => result.current.onOverlayBottomLayout(layout(500, 70)));
    expect(result.current.board.height).toBeCloseTo(400 - spacing.sm * 2);
  });
});
