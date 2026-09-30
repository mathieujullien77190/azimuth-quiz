import { act, renderHook, waitFor } from '@testing-library/react-native';

import { loadRoundData, type RoundData } from './firestoreContours';
import { useRoundData } from './useRoundData';

jest.mock('./firestoreContours', () => ({ loadRoundData: jest.fn() }));

const round = (code: string): RoundData => ({ country: { code } as never, neighborCountries: [] });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadRoundData).mockImplementation(async (code) => round(code));
});

describe('useRoundData', () => {
  it('has no data while the round loads, then gives it', async () => {
    let resolveRound: (data: RoundData) => void = () => {};
    jest
      .mocked(loadRoundData)
      .mockImplementationOnce(() => new Promise<RoundData>((resolve) => (resolveRound = resolve)));
    const { result } = await renderHook(() => useRoundData(['FR', 'ES'], 0));

    expect(result.current.data).toBeUndefined();
    await act(async () => resolveRound(round('FR')));
    expect(result.current.data?.country.code).toBe('FR');
    expect(result.current.failed).toBe(false);
  });

  it('reads the next round too, in the background', async () => {
    await renderHook(() => useRoundData(['FR', 'ES'], 0));

    await waitFor(() => expect(loadRoundData).toHaveBeenCalledWith('ES'));
  });

  it('does not read a next round after the last one', async () => {
    await renderHook(() => useRoundData(['FR', 'ES'], 1));

    await waitFor(() => expect(loadRoundData).toHaveBeenCalledWith('ES'));
    expect(loadRoundData).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed read of the next round', async () => {
    jest.mocked(loadRoundData).mockImplementation(async (code) => {
      if (code === 'ES') throw new Error('offline');
      return round(code);
    });
    const { result } = await renderHook(() => useRoundData(['FR', 'ES'], 0));

    await waitFor(() => expect(result.current.data?.country.code).toBe('FR'));
    expect(result.current.failed).toBe(false);
  });

  it('follows the round: the data of the previous one is not the new one', async () => {
    const { result, rerender } = await renderHook(({ index }: { index: number }) => useRoundData(['FR', 'ES'], index), {
      initialProps: { index: 0 },
    });
    await waitFor(() => expect(result.current.data?.country.code).toBe('FR'));

    await rerender({ index: 1 });
    await waitFor(() => expect(result.current.data?.country.code).toBe('ES'));
  });

  it('says so when the round cannot be read, and tries again on demand', async () => {
    jest.mocked(loadRoundData).mockRejectedValue(new Error('offline'));
    const { result } = await renderHook(() => useRoundData(['FR'], 0));
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.data).toBeUndefined();

    jest.mocked(loadRoundData).mockImplementation(async (code) => round(code));
    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.data?.country.code).toBe('FR'));
    expect(result.current.failed).toBe(false);
  });

  it('reads nothing when the room has no round to play', async () => {
    const { result } = await renderHook(() => useRoundData([], 0));

    expect(result.current.data).toBeUndefined();
    expect(loadRoundData).not.toHaveBeenCalled();
  });

  it('ignores a read that ends after the screen went away', async () => {
    let resolveFirst: (data: RoundData) => void = () => {};
    jest
      .mocked(loadRoundData)
      .mockImplementationOnce(() => new Promise<RoundData>((resolve) => (resolveFirst = resolve)));
    const { result, unmount } = await renderHook(() => useRoundData(['FR'], 0));
    await unmount();

    await act(async () => resolveFirst(round('FR')));
    expect(result.current.data).toBeUndefined();
  });

  it('ignores a failure that comes after the screen went away', async () => {
    let rejectFirst: (error: Error) => void = () => {};
    jest
      .mocked(loadRoundData)
      .mockImplementationOnce(() => new Promise<RoundData>((_, reject) => (rejectFirst = reject)));
    const { result, unmount } = await renderHook(() => useRoundData(['FR'], 0));
    await unmount();

    await act(async () => rejectFirst(new Error('late')));
    expect(result.current.failed).toBe(false);
  });
});
