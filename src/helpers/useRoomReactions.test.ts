import { act, renderHook } from '@testing-library/react-native';

import { REACTION_COOLDOWN_MS, REACTIONS_PER_GAME } from '@/data';

import { setErrorReporter, resetErrorThrottle } from './reportError';
import type { RoomPlayers, RoomReaction } from './roomBase';
import { useRoomReactions } from './useRoomReactions';

const PLAYERS: RoomPlayers = {
  zoe: { name: 'Zoé', joinedAt: null },
  max: { name: 'Max', joinedAt: null },
};
const reaction = (seq: number, uid = 'max', emoji = '🔥'): RoomReaction => ({ uid, emoji, seq });

type Props = { reaction: RoomReaction | null; players?: RoomPlayers };

const setup = async (initial: Props, sendReaction = jest.fn(() => Promise.resolve())) => {
  const hook = await renderHook(
    (props: Props) => useRoomReactions(props.reaction, props.players ?? PLAYERS, sendReaction, 'tabofuna'),
    { initialProps: initial },
  );
  return { ...hook, sendReaction };
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(10_000);
});
afterEach(() => jest.useRealTimers());

describe('useRoomReactions — what is received', () => {
  it('shows nothing until a reaction comes', async () => {
    const { result } = await setup({ reaction: null });
    expect(result.current.reaction).toBeNull();
  });

  it('ignores the reaction already in the room when the screen opens: it is an old one', async () => {
    const { result } = await setup({ reaction: reaction(1) });
    expect(result.current.reaction).toBeNull();
  });

  it('shows a new reaction with the name of its sender, whoever it is — the sender of this device too', async () => {
    const { result, rerender } = await setup({ reaction: null });
    await rerender({ reaction: reaction(1, 'max', '👍') });
    expect(result.current.reaction).toEqual({ emoji: '👍', name: 'Max', seq: 1 });
    await rerender({ reaction: reaction(2, 'zoe', '😂') });
    expect(result.current.reaction).toEqual({ emoji: '😂', name: 'Zoé', seq: 2 });
  });

  it('names nobody when the sender is not in the room any more', async () => {
    const { result, rerender } = await setup({ reaction: null });
    await rerender({ reaction: reaction(1, 'ghost') });
    expect(result.current.reaction).toEqual({ emoji: '🔥', name: null, seq: 1 });
  });

  it('shows a reaction once: the same one coming again changes nothing', async () => {
    const { result, rerender } = await setup({ reaction: null });
    await rerender({ reaction: reaction(1) });
    const first = result.current.reaction;
    await rerender({ reaction: reaction(1), players: { ...PLAYERS } });
    expect(result.current.reaction).toEqual(first);
  });
});

describe('useRoomReactions — what is sent', () => {
  it('sends the emoji to the room', async () => {
    const { result, sendReaction } = await setup({ reaction: null });
    await act(async () => result.current.send('🔥'));
    expect(sendReaction).toHaveBeenCalledWith('tabofuna', '🔥');
  });

  it('holds back a second send that comes too soon, and lets the next one through after the cooldown', async () => {
    const { result, sendReaction } = await setup({ reaction: null });
    await act(async () => result.current.send('🔥'));
    await act(async () => result.current.send('👍'));
    expect(sendReaction).toHaveBeenCalledTimes(1);

    await act(async () => jest.advanceTimersByTime(REACTION_COOLDOWN_MS));
    await act(async () => result.current.send('👍'));
    expect(sendReaction).toHaveBeenCalledTimes(2);
    expect(sendReaction).toHaveBeenLastCalledWith('tabofuna', '👍');
  });

  it('only logs a failed send, never raising it to the player', async () => {
    const reporter = jest.fn(() => Promise.resolve());
    setErrorReporter(reporter);
    resetErrorThrottle();
    const { result } = await setup({ reaction: null }, jest.fn(() => Promise.reject(new Error('offline'))));
    await act(async () => result.current.send('🔥'));
    await act(async () => {});
    expect(reporter).toHaveBeenCalledWith(expect.objectContaining({ action: 'room.reaction', kind: 'background' }));
    setErrorReporter(null);
  });
});

describe('useRoomReactions — alone in the room', () => {
  it('cannot react with nobody to send to, and can with another player', async () => {
    const alone = await setup({ reaction: null, players: { zoe: PLAYERS.zoe } });
    expect(alone.result.current.canReact).toBe(false);
    const together = await setup({ reaction: null });
    expect(together.result.current.canReact).toBe(true);
  });
});

describe('useRoomReactions — the limit per game', () => {
  it('lets a player send REACTIONS_PER_GAME reactions, then hides the button and sends no more', async () => {
    const { result, sendReaction } = await setup({ reaction: null });
    for (let index = 0; index < REACTIONS_PER_GAME; index += 1) {
      expect(result.current.canReact).toBe(true);
      await act(async () => result.current.send('👍'));
      await act(async () => jest.advanceTimersByTime(REACTION_COOLDOWN_MS));
    }
    expect(sendReaction).toHaveBeenCalledTimes(REACTIONS_PER_GAME);
    expect(result.current.canReact).toBe(false);
    await act(async () => result.current.send('👍'));
    expect(sendReaction).toHaveBeenCalledTimes(REACTIONS_PER_GAME);
  });
});
