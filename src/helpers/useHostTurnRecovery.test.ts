import { renderHook } from '@testing-library/react-native';

import type { OnlinePlayer } from './roomPlayers';
import { useHostTurnRecovery } from './useHostTurnRecovery';

const zoe: OnlinePlayer = { uid: 'zoe', name: 'Zoé', color: '#EF4444' };
const max: OnlinePlayer = { uid: 'max', name: 'Max', color: '#16A34A' };

type State = Parameters<typeof useHostTurnRecovery>[1];
const inGame: State = { screen: 'game', turnUid: 'max', verdict: null };

const setup = async (isHost: boolean, state: State, players: OnlinePlayer[]) => {
  const passTurn = jest.fn(() => Promise.resolve());
  const hook = await renderHook(
    (props: { players: OnlinePlayer[] }) => useHostTurnRecovery(isHost, state, props.players, passTurn),
    { initialProps: { players } },
  );
  return { passTurn, ...hook };
};

describe('useHostTurnRecovery', () => {
  it('hands the turn to the first player when the turn-holder left mid-round', async () => {
    const { passTurn, rerender } = await setup(true, inGame, [zoe, max]);
    expect(passTurn).not.toHaveBeenCalled();

    await rerender({ players: [zoe] });
    expect(passTurn).toHaveBeenCalledWith('zoe');
  });

  it('leaves a present turn-holder alone', async () => {
    const { passTurn } = await setup(true, inGame, [zoe, max]);
    expect(passTurn).not.toHaveBeenCalled();
  });

  it('does nothing on a joiner’s device', async () => {
    const { passTurn } = await setup(false, inGame, [zoe]);
    expect(passTurn).not.toHaveBeenCalled();
  });

  it('does nothing once the round is over, before the game starts, or while players load', async () => {
    expect((await setup(true, { ...inGame, verdict: 'correct' }, [zoe])).passTurn).not.toHaveBeenCalled();
    expect((await setup(true, { ...inGame, screen: 'options' }, [zoe])).passTurn).not.toHaveBeenCalled();
    expect((await setup(true, inGame, [])).passTurn).not.toHaveBeenCalled();
    expect((await setup(true, { ...inGame, turnUid: null }, [zoe])).passTurn).not.toHaveBeenCalled();
  });
});
