import { getDoc } from 'firebase/firestore';

import { clearCounts, loadCounts, preloadCounts } from '../counts';

jest.mock('firebase/firestore', () => ({ doc: jest.fn(() => 'countsRef'), getDoc: jest.fn() }));
jest.mock('@/firebase/client', () => ({ db: {} }));

const counts = { cities: { easy: 3 } };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  clearCounts();
});

describe('counts', () => {
  it('reads the document once and shares it', async () => {
    jest.mocked(getDoc).mockResolvedValue({ data: () => ({ counts }) } as never);

    expect(await loadCounts()).toEqual(counts);
    expect(await loadCounts()).toEqual(counts);
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('reads an absent document as no places', async () => {
    jest.mocked(getDoc).mockResolvedValue({ data: () => undefined } as never);

    expect(await loadCounts()).toEqual({});
  });

  it('does not keep a failed read: the next call reads again', async () => {
    jest.mocked(getDoc).mockRejectedValueOnce(new Error('offline'));
    await expect(loadCounts()).rejects.toThrow('offline');

    jest.mocked(getDoc).mockResolvedValue({ data: () => ({ counts }) } as never);
    expect(await loadCounts()).toEqual(counts);
  });

  it('preloads without waiting, and swallows a failure', async () => {
    jest.mocked(getDoc).mockRejectedValue(new Error('offline'));

    expect(() => preloadCounts()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(getDoc).toHaveBeenCalledTimes(1);
  });
});
