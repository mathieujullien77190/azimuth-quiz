import { getDoc } from 'firebase/firestore';

import { clearContourCounts, loadContourCounts, preloadContourCounts } from './contourCounts';

jest.mock('firebase/firestore', () => ({ doc: jest.fn(() => 'countsRef'), getDoc: jest.fn() }));
jest.mock('@/helpers/firebase', () => ({ db: {} }));

const counts = { easy: 2, intermediate: 150, hard: 1 };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  clearContourCounts();
});

describe('contourCounts', () => {
  it('reads the sizes of the difficulty groups once and shares them', async () => {
    jest.mocked(getDoc).mockResolvedValue({ data: () => ({ counts }) } as never);

    expect(await loadContourCounts()).toEqual(counts);
    expect(await loadContourCounts()).toEqual(counts);
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('reads an absent document as no countries', async () => {
    jest.mocked(getDoc).mockResolvedValue({ data: () => undefined } as never);

    expect(await loadContourCounts()).toEqual({});
  });

  it('preloads without waiting, and swallows a failure', async () => {
    jest.mocked(getDoc).mockRejectedValue(new Error('offline'));

    expect(() => preloadContourCounts()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(getDoc).toHaveBeenCalledTimes(1);
  });
});
