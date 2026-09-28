import { act, renderHook } from '@testing-library/react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useSectionScroll } from './useSectionScroll';

/** A scroll event `offsetY` px from the top of a 1000px-tall content in a 600px viewport. */
const scrollEvent = (offsetY: number) =>
  ({
    nativeEvent: {
      contentOffset: { x: 0, y: offsetY },
      contentSize: { width: 300, height: 1000 },
      layoutMeasurement: { width: 300, height: 600 },
    },
  }) as NativeSyntheticEvent<NativeScrollEvent>;

const AT_TOP = 0;
const MIDDLE = 200;
const AT_BOTTOM = 400;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const setup = async () => {
  const hook = await renderHook(() => useSectionScroll());
  const scrollToEnd = jest.fn();
  const scrollTo = jest.fn();
  hook.result.current.scrollRef.current = { scrollToEnd, scrollTo } as never;
  return { ...hook, scrollToEnd, scrollTo };
};

describe('useSectionScroll', () => {
  it('starts on the distance section', async () => {
    const { result } = await setup();
    expect(result.current.onCap).toBe(false);
  });

  it('switches the label at once when the button is pressed, and scrolls', async () => {
    const { result, scrollToEnd, scrollTo } = await setup();
    await act(async () => result.current.goToCap());
    expect(result.current.onCap).toBe(true);
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });

    await act(async () => result.current.goToDistance());
    expect(result.current.onCap).toBe(false);
    expect(scrollTo).toHaveBeenCalledWith({ animated: true, y: 0 });
  });

  it('does not flip the label back while the scroll is still leaving the departure edge', async () => {
    const { result } = await setup();
    await act(async () => result.current.goToCap());

    // The animation starts next to the top: those events must not undo the press.
    await act(async () => result.current.handleScroll(scrollEvent(AT_TOP)));
    expect(result.current.onCap).toBe(true);
    await act(async () => result.current.handleScroll(scrollEvent(MIDDLE)));
    expect(result.current.onCap).toBe(true);

    // Arrived: the label stays, and the player is believed again from then on.
    await act(async () => result.current.handleScroll(scrollEvent(AT_BOTTOM)));
    expect(result.current.onCap).toBe(true);
    await act(async () => result.current.handleScroll(scrollEvent(AT_TOP)));
    expect(result.current.onCap).toBe(false);
  });

  it('follows a manual drag to either edge', async () => {
    const { result } = await setup();
    await act(async () => result.current.handleScroll(scrollEvent(AT_BOTTOM)));
    expect(result.current.onCap).toBe(true);
    await act(async () => result.current.handleScroll(scrollEvent(MIDDLE)));
    expect(result.current.onCap).toBe(true);
    await act(async () => result.current.handleScroll(scrollEvent(AT_TOP)));
    expect(result.current.onCap).toBe(false);
  });

  it('believes the scroll again after the travel time, if the section was never reached', async () => {
    const { result } = await setup();
    await act(async () => result.current.goToCap());
    await act(async () => jest.advanceTimersByTime(900));
    // Nothing to scroll to (short content, say): the player dragging back to the top counts.
    await act(async () => result.current.handleScroll(scrollEvent(AT_TOP)));
    expect(result.current.onCap).toBe(false);
  });
});
