import { act, fireEvent, render } from '@testing-library/react-native';

import { RISE_MS } from './constants';
import ReactionOverlay from '.';

const reaction = (seq: number, name: string | null = 'Zoé', emoji = '🔥') => ({ emoji, name, seq });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('ReactionOverlay', () => {
  it('shows nothing while no reaction has come', async () => {
    const { queryByText } = await render(<ReactionOverlay reaction={null} />);
    expect(queryByText('🔥')).toBeNull();
  });

  it('shows the emoji with the name of whoever sent it under it', async () => {
    const { getByText } = await render(<ReactionOverlay reaction={reaction(1)} />);
    expect(getByText('🔥')).toBeTruthy();
    expect(getByText('Zoé')).toBeTruthy();
  });

  it('shows the emoji alone when the sender is not known any more', async () => {
    const { getByText, queryByText } = await render(<ReactionOverlay reaction={reaction(1, null)} />);
    expect(getByText('🔥')).toBeTruthy();
    expect(queryByText('Zoé')).toBeNull();
  });

  it('never catches a touch itself', async () => {
    const { getByText } = await render(<ReactionOverlay reaction={reaction(1)} />);
    let node = getByText('🔥').parent;
    const flags: unknown[] = [];
    while (node) {
      flags.push(node.props.pointerEvents);
      node = node.parent;
    }
    expect(flags).toContain('none');
  });

  it('goes once it has risen out of sight', async () => {
    const { queryByText } = await render(<ReactionOverlay reaction={reaction(1)} />);
    expect(queryByText('🔥')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(RISE_MS - 1));
    expect(queryByText('🔥')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(2));
    expect(queryByText('🔥')).toBeNull();
  });

  it('lets reactions in a row each run their own course instead of replacing one another', async () => {
    const { rerender, getByText, queryByText } = await render(<ReactionOverlay reaction={reaction(1, 'Zoé', '🔥')} />);
    await act(() => jest.advanceTimersByTime(RISE_MS / 2));
    await rerender(<ReactionOverlay reaction={reaction(2, 'Max', '👍')} />);
    expect(getByText('🔥')).toBeTruthy();
    expect(getByText('👍')).toBeTruthy();

    // The first one finishes while the second one is still on its way up.
    await act(() => jest.advanceTimersByTime(RISE_MS / 2 + 1));
    expect(queryByText('🔥')).toBeNull();
    expect(getByText('👍')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(RISE_MS / 2));
    expect(queryByText('👍')).toBeNull();
  });

  it('does not start a second bubble for the same reaction shown again', async () => {
    const { rerender, getAllByText } = await render(<ReactionOverlay reaction={reaction(1)} />);
    await rerender(<ReactionOverlay reaction={reaction(1)} />);
    expect(getAllByText('🔥')).toHaveLength(1);
  });

  it('measures the screen to know how far up to rise, and keeps rising when it is measured again', async () => {
    const { getByText } = await render(<ReactionOverlay reaction={reaction(1)} />);
    let overlay = getByText('🔥').parent;
    while (overlay && typeof overlay.props.onLayout !== 'function') overlay = overlay.parent;
    await act(async () => fireEvent(overlay!, 'layout', { nativeEvent: { layout: { height: 800 } } }));
    expect(getByText('🔥')).toBeTruthy();
  });
});
