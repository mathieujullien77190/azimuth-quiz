import { act, renderHook } from '@testing-library/react-native';

import { TRAVEL_NOTICE_MS } from './constants';
import { useTravelNotice } from './useTravelNotice';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

type Props = { roundIndex: number; message: string | undefined };

const run = (roundIndex: number, message: string | undefined) =>
  renderHook((props: Props) => useTravelNotice(props.roundIndex, props.message), {
    initialProps: { roundIndex, message },
  });

describe('useTravelNotice', () => {
  it('is up as the round opens, and gone by itself after the delay', async () => {
    const { result } = await run(1, 'Vous êtes à Rome');
    expect(result.current.travelNotice).toBe('Vous êtes à Rome');
    await act(async () => jest.advanceTimersByTime(TRAVEL_NOTICE_MS - 1));
    expect(result.current.travelNotice).toBe('Vous êtes à Rome');
    await act(async () => jest.advanceTimersByTime(1));
    expect(result.current.travelNotice).toBeNull();
  });

  it('is gone on a tap, without waiting for the delay', async () => {
    const { result } = await run(1, 'Vous êtes à Rome');
    await act(async () => result.current.dismissTravelNotice());
    expect(result.current.travelNotice).toBeNull();
  });

  it('stays gone for the rest of that round (the reveal), and comes back with the next one', async () => {
    const { result, rerender } = await run(1, 'Vous êtes à Rome');
    await act(async () => result.current.dismissTravelNotice());
    await rerender({ roundIndex: 1, message: 'Vous êtes à Rome' });
    expect(result.current.travelNotice).toBeNull();

    // The next round: a place with the same name still gets its own splash (it is keyed by the round).
    await rerender({ roundIndex: 2, message: 'Vous êtes à Rome' });
    expect(result.current.travelNotice).toBe('Vous êtes à Rome');
  });

  it('never shows, nor sets its timer, without anything to say', async () => {
    const setTimer = jest.spyOn(global, 'setTimeout');
    const { result } = await run(0, undefined);
    expect(result.current.travelNotice).toBeNull();
    expect(setTimer.mock.calls.filter(([, delay]) => delay === TRAVEL_NOTICE_MS)).toHaveLength(0);
    setTimer.mockRestore();
  });

  it('drops its timer on the way out', async () => {
    const setTimer = jest.spyOn(global, 'setTimeout');
    const clearTimer = jest.spyOn(global, 'clearTimeout');
    const { unmount } = await run(1, 'Vous êtes à Rome');
    const ours = setTimer.mock.calls.findIndex(([, delay]) => delay === TRAVEL_NOTICE_MS);
    expect(ours).toBeGreaterThanOrEqual(0);
    await unmount();
    expect(clearTimer).toHaveBeenCalledWith(setTimer.mock.results[ours].value);
    setTimer.mockRestore();
    clearTimer.mockRestore();
  });
});
