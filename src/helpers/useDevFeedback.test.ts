import { act, renderHook } from '@testing-library/react-native';

import { DEV_CODE } from '@/data';
import { useDevCode } from '@/settings';

import { sendDevFeedback } from './devFeedback';
import { useDevFeedback, type DevFeedbackTarget } from './useDevFeedback';

jest.mock('./devFeedback', () => ({ sendDevFeedback: jest.fn(() => Promise.resolve()) }));
jest.mock('./reportError', () => ({ reporting: jest.fn(() => jest.fn()) }));
jest.mock('@/helpers', () => ({ ...jest.requireActual('@/helpers'), saveDevCode: jest.fn() }));

const target: DevFeedbackTarget = { targetType: 'place', targetKey: 'vic', name: 'Chutes Victoria', difficulty: 'intermediate' };
const next: DevFeedbackTarget = { targetType: 'place', targetKey: 'ven', name: 'Mont Ventoux', difficulty: 'hard' };

type Props = { roundIndex?: number; roundOver?: boolean; gameOver?: boolean; target?: DevFeedbackTarget | undefined };

const setup = async (initial: Props = {}) =>
  renderHook(
    (props: Props) =>
      useDevFeedback({ game: 'compass', roundIndex: 0, roundOver: false, gameOver: false, target, ...props }),
    { initialProps: initial },
  );

/** Round 0 reaches its reveal, then the host moves on to round 1. */
const moveOn = async (ctx: Awaited<ReturnType<typeof setup>>, props: Props = {}, endedTarget: DevFeedbackTarget | null = target) => {
  await ctx.rerender({ roundIndex: 0, roundOver: true, target: endedTarget ?? undefined });
  await ctx.rerender({ roundIndex: 1, roundOver: false, target: next, ...props });
};

beforeEach(() => {
  jest.clearAllMocks();
  useDevCode.setState({ devCode: DEV_CODE });
});

describe('useDevFeedback', () => {
  it('asks nothing while the round is on, nor over its own reveal', async () => {
    const ctx = await setup();
    expect(ctx.result.current.question).toBeNull();
    await ctx.rerender({ roundOver: true });
    expect(ctx.result.current.question).toBeNull();
  });

  it('asks about the PREVIOUS place once the host has moved on, not about the new one', async () => {
    const ctx = await setup();
    await moveOn(ctx);
    expect(ctx.result.current.question).toBe('Le lieu Chutes Victoria était-il…');
  });

  it('asks nothing without the dev code, or when the round never had a target', async () => {
    useDevCode.setState({ devCode: 'nope' });
    const off = await setup();
    await moveOn(off);
    expect(off.result.current.question).toBeNull();

    useDevCode.setState({ devCode: DEV_CODE });
    const noTarget = await setup({ target: undefined });
    await moveOn(noTarget, { target: undefined }, null);
    expect(noTarget.result.current.question).toBeNull();
  });

  it('writes the opinion about the previous round on a choice, then asks no more for it', async () => {
    const ctx = await setup({ roundIndex: 2 });
    await ctx.rerender({ roundIndex: 2, roundOver: true });
    await ctx.rerender({ roundIndex: 3, roundOver: false, target: next });
    await act(async () => ctx.result.current.choose('hard'));
    expect(sendDevFeedback).toHaveBeenCalledWith({
      game: 'compass',
      targetType: 'place',
      targetKey: 'vic',
      name: 'Chutes Victoria',
      currentDifficulty: 'intermediate',
      suggestedDifficulty: 'hard',
    });
    expect(ctx.result.current.question).toBeNull();
    // Still the same round (the new round's own state moving): not asked twice.
    await ctx.rerender({ roundIndex: 3, roundOver: false, target: next });
    expect(ctx.result.current.question).toBeNull();
  });

  it('drops the question without writing anything on a dismissal', async () => {
    const ctx = await setup();
    await moveOn(ctx);
    await act(async () => ctx.result.current.dismiss());
    expect(sendDevFeedback).not.toHaveBeenCalled();
    expect(ctx.result.current.question).toBeNull();
  });

  it('asks only about the latest ended round when two go by', async () => {
    const ctx = await setup();
    await moveOn(ctx);
    expect(ctx.result.current.question).toBe('Le lieu Chutes Victoria était-il…');
    // Round 1 ends before the answer: the question about round 0 is gone (never over a reveal), round 1 is asked next.
    await ctx.rerender({ roundIndex: 1, roundOver: true, target: next });
    expect(ctx.result.current.question).toBeNull();
    await ctx.rerender({ roundIndex: 2, roundOver: false, target: target });
    expect(ctx.result.current.question).toBe('Le lieu Mont Ventoux était-il…');
  });

  it('asks about the last round on the final standings, even if the round still looks over', async () => {
    const ctx = await setup({ roundIndex: 4 });
    await ctx.rerender({ roundIndex: 4, roundOver: true });
    // The end: the round counter points past the last round and the verdict may still be there.
    await ctx.rerender({ roundIndex: 5, roundOver: true, gameOver: true, target: undefined });
    expect(ctx.result.current.question).toBe('Le lieu Chutes Victoria était-il…');
    await act(async () => ctx.result.current.dismiss());
    expect(ctx.result.current.question).toBeNull();
  });

  it('forgets the previous game when the round counter goes back (a replay on the same room)', async () => {
    const ctx = await setup({ roundIndex: 3 });
    await ctx.rerender({ roundIndex: 3, roundOver: true });
    await ctx.rerender({ roundIndex: 4, roundOver: false, target: next });
    expect(ctx.result.current.question).toBe('Le lieu Chutes Victoria était-il…');
    await act(async () => ctx.result.current.dismiss());

    // A new game: the counter is back at 0, nothing stale is asked, and a dismissal of the old game does not linger.
    await ctx.rerender({ roundIndex: 0, roundOver: false, target });
    expect(ctx.result.current.question).toBeNull();
    await ctx.rerender({ roundIndex: 0, roundOver: true });
    await ctx.rerender({ roundIndex: 1, roundOver: false, target: next });
    expect(ctx.result.current.question).toBe('Le lieu Chutes Victoria était-il…');
  });

  it('writes nothing, and drops nothing, when there is no ended round yet', async () => {
    const ctx = await setup();
    await act(async () => ctx.result.current.choose('easy'));
    await act(async () => ctx.result.current.dismiss());
    expect(sendDevFeedback).not.toHaveBeenCalled();
    expect(ctx.result.current.question).toBeNull();
  });
});
