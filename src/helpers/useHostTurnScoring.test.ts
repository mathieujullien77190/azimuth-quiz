import { renderHook } from '@testing-library/react-native';

import { useHostTurnScoring } from './useHostTurnScoring';

type State = Parameters<typeof useHostTurnScoring>[1];

const baseState: State = {
  roundIndex: 0,
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  totalScores: { zoe: 100 },
};

const setup = async (isHost: boolean, state: State) => {
  const applyScore = jest.fn(() => Promise.resolve());
  const hook = await renderHook(
    (props: { isHost: boolean; state: State }) => useHostTurnScoring(props.isHost, props.state, 375, 50, applyScore),
    { initialProps: { isHost, state } },
  );
  return { applyScore, ...hook };
};

describe('useHostTurnScoring — a find', () => {
  it('adds the reward to the winner’s total, once per round', async () => {
    const { applyScore, rerender } = await setup(true, baseState);
    expect(applyScore).not.toHaveBeenCalled();

    const found: State = { ...baseState, verdict: 'correct', roundWinnerUid: 'zoe' };
    await rerender({ isHost: true, state: found });
    expect(applyScore).toHaveBeenCalledWith({ zoe: 475 });

    // Same round re-delivered (e.g. a totals update) must not score it a second time.
    await rerender({ isHost: true, state: { ...found, totalScores: { zoe: 475 } } });
    expect(applyScore).toHaveBeenCalledTimes(1);
  });

  it('scores again on the next round', async () => {
    const { applyScore, rerender } = await setup(true, { ...baseState, verdict: 'correct', roundWinnerUid: 'zoe' });
    expect(applyScore).toHaveBeenCalledTimes(1);
    await rerender({
      isHost: true,
      state: { ...baseState, roundIndex: 1, verdict: 'correct', roundWinnerUid: 'max', totalScores: { zoe: 475 } },
    });
    expect(applyScore).toHaveBeenLastCalledWith({ zoe: 475, max: 375 });
  });

  it('does nothing for a give-up, or on a joiner’s device', async () => {
    const giveUp = await setup(true, { ...baseState, verdict: 'giveUp' });
    expect(giveUp.applyScore).not.toHaveBeenCalled();
    const joiner = await setup(false, { ...baseState, verdict: 'correct', roundWinnerUid: 'zoe' });
    expect(joiner.applyScore).not.toHaveBeenCalled();
  });
});

describe('useHostTurnScoring — a miss', () => {
  it('deducts the penalty once per wrongGuessSeq advance', async () => {
    const { applyScore, rerender } = await setup(true, baseState);
    const missed: State = { ...baseState, wrongGuessUid: 'zoe', wrongGuessSeq: 1 };
    await rerender({ isHost: true, state: missed });
    expect(applyScore).toHaveBeenCalledWith({ zoe: 50 });

    await rerender({ isHost: true, state: { ...missed, totalScores: { zoe: 50 } } });
    expect(applyScore).toHaveBeenCalledTimes(1);

    await rerender({ isHost: true, state: { ...missed, wrongGuessSeq: 2, totalScores: { zoe: 50 } } });
    expect(applyScore).toHaveBeenLastCalledWith({ zoe: 0 });
  });

  it('catches up to the seq a reconnecting host mounts on without re-applying it', async () => {
    const { applyScore } = await setup(true, { ...baseState, wrongGuessUid: 'zoe', wrongGuessSeq: 3 });
    expect(applyScore).not.toHaveBeenCalled();
  });
});

describe('useHostTurnScoring — first points', () => {
  it('starts from zero for a player with no total yet, on a miss', async () => {
    const { applyScore, rerender } = await setup(true, { ...baseState, totalScores: {} });
    await rerender({ isHost: true, state: { ...baseState, totalScores: {}, wrongGuessUid: 'max', wrongGuessSeq: 1 } });
    expect(applyScore).toHaveBeenCalledWith({ max: -50 });
  });
});

describe('useHostTurnScoring — failing writes', () => {
  it('swallows a rejected score write, for a find as for a miss', async () => {
    const applyScore = jest.fn(() => Promise.reject(new Error('offline')));
    const { rerender } = await renderHook(
      (props: { state: State }) => useHostTurnScoring(true, props.state, 375, 50, applyScore),
      { initialProps: { state: baseState } },
    );
    await rerender({ state: { ...baseState, verdict: 'correct', roundWinnerUid: 'zoe' } });
    await rerender({ state: { ...baseState, wrongGuessUid: 'zoe', wrongGuessSeq: 1 } });
    expect(applyScore).toHaveBeenCalledTimes(2);
  });
});
