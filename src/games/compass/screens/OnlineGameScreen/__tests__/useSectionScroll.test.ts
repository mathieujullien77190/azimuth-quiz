import { act, renderHook } from '@testing-library/react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useSectionScroll } from '../useSectionScroll';

/** Evenement de defilement a `offsetY` px du haut d'un contenu de 1000px dans une vue de 600px. */
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

    // L'animation demarre pres du haut : ces evenements ne doivent pas annuler l'appui.
    await act(async () => result.current.handleScroll(scrollEvent(AT_TOP)));
    expect(result.current.onCap).toBe(true);
    await act(async () => result.current.handleScroll(scrollEvent(MIDDLE)));
    expect(result.current.onCap).toBe(true);

    // Arrive : le libelle reste, et le joueur est de nouveau cru.
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
    // Rien a defiler (contenu court) : le joueur qui remonte en haut compte.
    await act(async () => result.current.handleScroll(scrollEvent(AT_TOP)));
    expect(result.current.onCap).toBe(false);
  });
});
