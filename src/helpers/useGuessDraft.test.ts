import { act, renderHook } from '@testing-library/react-native';

import { useGuessDraft } from './useGuessDraft';

const setup = (roundIndex = 0, turnUid: string | null = 'zoe') =>
  renderHook(
    (props: { roundIndex: number; turnUid: string | null }) => useGuessDraft(props.roundIndex, props.turnUid),
    {
      initialProps: { roundIndex, turnUid },
    },
  );

describe('useGuessDraft', () => {
  it('starts empty', async () => {
    const { result } = await setup();
    expect(result.current.guessText).toBe('');
    expect(result.current.lastWrong).toBeNull();
  });

  it('keeps what was typed and the last miss while nothing changes', async () => {
    const { result, rerender } = await setup();
    await act(async () => {
      result.current.setGuessText('Par');
      result.current.setLastWrong('Zoé');
    });
    await rerender({ roundIndex: 0, turnUid: 'zoe' });
    expect(result.current.guessText).toBe('Par');
    expect(result.current.lastWrong).toBe('Zoé');
  });

  it.each([
    ['the turn passes to someone else', { roundIndex: 0, turnUid: 'max' }],
    ['the next round starts', { roundIndex: 1, turnUid: 'zoe' }],
    ['nobody has the turn any more', { roundIndex: 0, turnUid: null }],
  ])('starts over when %s', async (_, next) => {
    const { result, rerender } = await setup();
    await act(async () => {
      result.current.setGuessText('Par');
      result.current.setLastWrong('Zoé');
    });
    await rerender(next);
    expect(result.current.guessText).toBe('');
    expect(result.current.lastWrong).toBeNull();
  });
});
