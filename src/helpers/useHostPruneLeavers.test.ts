import { renderHook } from '@testing-library/react-native';

import type { RoomPlayers } from './roomBase';
import { useHostPruneLeavers } from './useHostPruneLeavers';

const player = (name: string) => ({ name, joinedAt: null });
const PLAYERS: RoomPlayers = { host: player('Zoé'), max: player('Max') };

const setup = async (
  overrides: Partial<{ isHost: boolean; localUid: string | null; players: RoomPlayers; gameState: unknown }> = {},
) => {
  const prune = jest.fn(() => Promise.resolve());
  const props = { isHost: true, localUid: 'host', players: PLAYERS, gameState: {}, ...overrides };
  const hook = await renderHook(
    (current: typeof props) =>
      useHostPruneLeavers(current.isHost, current.localUid, current.players, current.gameState, prune),
    { initialProps: props },
  );
  return { prune, props, ...hook };
};

describe('useHostPruneLeavers', () => {
  it('erases, in every map, what a player who is no longer in the room left behind', async () => {
    const { prune } = await setup({
      gameState: {
        guesses: { host: {}, max: {}, eve: {} },
        scores: { host: {}, eve: {} },
        totalScores: { host: 10, eve: 30, ghost: 5 },
      },
    });
    expect(prune).toHaveBeenCalledWith({
      guesses: ['eve'],
      scores: ['eve'],
      totalScores: ['eve', 'ghost'],
    });
  });

  it('only names the maps that actually hold something stale', async () => {
    const { prune } = await setup({ gameState: { totalScores: { host: 10, eve: 30 } } });
    expect(prune).toHaveBeenCalledWith({ totalScores: ['eve'] });
  });

  it('does nothing when everybody in the round data is still in the room', async () => {
    const { prune } = await setup({ gameState: { guesses: { host: {} }, totalScores: { host: 1, max: 2 } } });
    expect(prune).not.toHaveBeenCalled();
  });

  it('copes with a game state that has none of these maps, or a null one (scores before the reveal)', async () => {
    const withoutMaps = await setup({ gameState: { screen: 'game' } });
    expect(withoutMaps.prune).not.toHaveBeenCalled();
    await withoutMaps.unmount();
    const nullScores = await setup({ gameState: { scores: null } });
    expect(nullScores.prune).not.toHaveBeenCalled();
  });

  it('is left to the host', async () => {
    const { prune } = await setup({ isHost: false, gameState: { totalScores: { eve: 30 } } });
    expect(prune).not.toHaveBeenCalled();
  });

  it('waits until this device knows who it is and is listed among the players', async () => {
    const unknown = await setup({ localUid: null, gameState: { totalScores: { eve: 30 } } });
    expect(unknown.prune).not.toHaveBeenCalled();
    await unknown.unmount();
    // The players list not loaded yet (empty) would otherwise read as "everybody left".
    const notListed = await setup({ players: {}, gameState: { totalScores: { host: 30 } } });
    expect(notListed.prune).not.toHaveBeenCalled();
  });

  it('cleans up as soon as a player leaves during the game', async () => {
    const { prune, rerender, props } = await setup({ gameState: { totalScores: { host: 10, max: 20 } } });
    expect(prune).not.toHaveBeenCalled();
    await rerender({ ...props, players: { host: player('Zoé') } });
    expect(prune).toHaveBeenCalledWith({ totalScores: ['max'] });
  });

  it('swallows a failed write', async () => {
    const failing = jest.fn(() => Promise.reject(new Error('offline')));
    await renderHook(() => useHostPruneLeavers(true, 'host', PLAYERS, { totalScores: { eve: 1 } }, failing));
    expect(failing).toHaveBeenCalledTimes(1);
  });
});
