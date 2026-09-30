import { getDoc } from 'firebase/firestore';

import { clearCompassCounts, loadCompassCounts, preloadCompassCounts } from './compassCounts';

jest.mock('firebase/firestore', () => ({ doc: jest.fn(() => 'countsRef'), getDoc: jest.fn() }));
jest.mock('@/helpers/firebase', () => ({ db: {} }));

const counts = { cities: { easy: 3 } };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  clearCompassCounts();
});

describe('compassCounts', () => {
  it('reads the document once and shares it', async () => {
    jest.mocked(getDoc).mockResolvedValue({ data: () => ({ counts }) } as never);

    expect(await loadCompassCounts()).toEqual(counts);
    expect(await loadCompassCounts()).toEqual(counts);
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('reads an absent document as no places', async () => {
    jest.mocked(getDoc).mockResolvedValue({ data: () => undefined } as never);

    expect(await loadCompassCounts()).toEqual({});
  });

  it('does not keep a failed read: the next call reads again', async () => {
    jest.mocked(getDoc).mockRejectedValueOnce(new Error('offline'));
    await expect(loadCompassCounts()).rejects.toThrow('offline');

    jest.mocked(getDoc).mockResolvedValue({ data: () => ({ counts }) } as never);
    expect(await loadCompassCounts()).toEqual(counts);
  });

  it('preloads without waiting, and swallows a failure', async () => {
    jest.mocked(getDoc).mockRejectedValue(new Error('offline'));

    expect(() => preloadCompassCounts()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(getDoc).toHaveBeenCalledTimes(1);
  });
});
