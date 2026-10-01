import { onSnapshot, updateDoc } from 'firebase/firestore';

import { DEFAULT_CONTOUR_SETTINGS } from '@/games/contour/constants';

import {
  applyContourRoomScore,
  contourRoomSettingsFrom,
  giveUpContourRoom,
  nextContourRoomRound,
  reportContourRoomCorrect,
  reportContourRoomWrong,
  revealContourRoomHint,
  setContourRoomTyping,
  startContourRoomGame,
  subscribeToRoomGame,
} from './room';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(),
  doc: jest.fn((_db, collectionName: string, code: string) => ({ path: `${collectionName}/${code}` })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
  where: jest.fn(),
}));
jest.mock('@/helpers/firebase', () => ({ db: {} }));
jest.mock('@/helpers/roomCode', () => ({
  generateRoomCode: jest.fn(),
  getLocalUid: jest.fn(),
  isValidRoomCode: jest.fn(),
}));

const REF = { path: 'rooms/tabofuna' };

beforeEach(() => jest.clearAllMocks());

describe('contourRoomSettingsFrom', () => {
  it('shares every setting except the local player names', () => {
    const shared = contourRoomSettingsFrom(DEFAULT_CONTOUR_SETTINGS);
    expect(shared).not.toHaveProperty('playerName');
    expect(shared).toMatchObject({ rounds: DEFAULT_CONTOUR_SETTINGS.rounds });
  });

  it('shares the hint categories the host picked (all four by default)', () => {
    expect(contourRoomSettingsFrom(DEFAULT_CONTOUR_SETTINGS).hintCategories).toEqual([
      'silhouette',
      'neighbors',
      'cities',
      'capital',
    ]);
    expect(
      contourRoomSettingsFrom({ ...DEFAULT_CONTOUR_SETTINGS, hintCategories: ['capital'] }).hintCategories,
    ).toEqual(['capital']);
  });
});

describe('game writes', () => {
  it('startContourRoomGame seeds the countries and the simplification, and gives the first turn', async () => {
    await startContourRoomGame('tabofuna', ['FR', 'ES'], 'zoe', 1234);
    expect(updateDoc).toHaveBeenCalledWith(REF, {
      screen: 'game',
      countryCodes: ['FR', 'ES'],
      simplifySeed: 1234,
      roundIndex: 0,
      hintsRevealed: 0,
      hintPicks: [],
      typing: null,
      turnUid: 'zoe',
      verdict: null,
      roundWinnerUid: null,
      wrongGuessUid: null,
      wrongGuessSeq: 0,
      totalScores: {},
    });
  });

  it('revealContourRoomHint writes the picks, their count, and hands the turn over', async () => {
    await revealContourRoomHint('tabofuna', ['silhouette', 'neighbors'], 'max');
    expect(updateDoc).toHaveBeenCalledWith(REF, {
      hintPicks: ['silhouette', 'neighbors'],
      hintsRevealed: 2,
      turnUid: 'max',
    });
  });

  it('setContourRoomTyping mirrors the text being typed, with who types it', async () => {
    await setContourRoomTyping('tabofuna', 'zoe', 'Fra');
    expect(updateDoc).toHaveBeenCalledWith(REF, { typing: { uid: 'zoe', text: 'Fra' } });
  });

  it('reportContourRoomCorrect names the winner', async () => {
    await reportContourRoomCorrect('tabofuna', 'zoe');
    expect(updateDoc).toHaveBeenCalledWith(REF, { verdict: 'correct', roundWinnerUid: 'zoe' });
  });

  it('giveUpContourRoom ends the round without a winner', async () => {
    await giveUpContourRoom('tabofuna');
    expect(updateDoc).toHaveBeenCalledWith(REF, { verdict: 'giveUp' });
  });

  it('reportContourRoomWrong reports the miss with its sequence number', async () => {
    await reportContourRoomWrong('tabofuna', 'zoe', 3);
    expect(updateDoc).toHaveBeenCalledWith(REF, { wrongGuessUid: 'zoe', wrongGuessSeq: 3 });
  });

  it('applyContourRoomScore writes the running totals', async () => {
    await applyContourRoomScore('tabofuna', { zoe: 12 });
    expect(updateDoc).toHaveBeenCalledWith(REF, { totalScores: { zoe: 12 } });
  });

  it('nextContourRoomRound resets the board while rounds remain', async () => {
    await nextContourRoomRound('tabofuna', 2, 5, 'zoe');
    expect(updateDoc).toHaveBeenCalledWith(REF, {
      screen: 'game',
      roundIndex: 2,
      hintsRevealed: 0,
      hintPicks: [],
      typing: null,
      turnUid: 'zoe',
      verdict: null,
      roundWinnerUid: null,
    });
  });

  it('nextContourRoomRound ends the game past the last round', async () => {
    await nextContourRoomRound('tabofuna', 5, 5, 'zoe');
    expect(jest.mocked(updateDoc).mock.calls[0][1]).toMatchObject({ screen: 'end', roundIndex: 5 });
  });
});

describe('subscribeToRoomGame', () => {
  const emit = (exists: boolean, data?: Record<string, unknown>) => {
    const unsubscribe = jest.fn();
    jest.mocked(onSnapshot).mockImplementation(((_ref: unknown, callback: (value: unknown) => void) => {
      callback({ exists: () => exists, data: () => data });
      return unsubscribe;
    }) as never);
    return unsubscribe;
  };

  it('forwards the round state', () => {
    const state = {
      screen: 'game',
      countryCodes: ['FR'],
      simplifySeed: 99,
      roundIndex: 1,
      hintsRevealed: 3,
      hintPicks: ['silhouette', 'neighbors', 'cities'],
      typing: { uid: 'zoe', text: 'Fra' },
      turnUid: 'zoe',
      verdict: 'giveUp',
      roundWinnerUid: 'zoe',
      wrongGuessUid: 'max',
      wrongGuessSeq: 2,
      totalScores: { zoe: 5 },
    };
    emit(true, state);
    const onUpdate = jest.fn();
    subscribeToRoomGame('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith(state);
  });

  it('falls back to lobby defaults for missing fields (a room without a seed gets 0)', () => {
    emit(true, {});
    const onUpdate = jest.fn();
    subscribeToRoomGame('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({
      screen: 'options',
      countryCodes: [],
      simplifySeed: 0,
      roundIndex: 0,
      hintsRevealed: 0,
      hintPicks: [],
      typing: null,
      turnUid: null,
      verdict: null,
      roundWinnerUid: null,
      wrongGuessUid: null,
      wrongGuessSeq: 0,
      totalScores: {},
    });
  });

  it('reports nothing once the room is gone, and returns the unsubscribe', () => {
    const unsubscribe = emit(false);
    const onUpdate = jest.fn();
    expect(subscribeToRoomGame('tabofuna', onUpdate)).toBe(unsubscribe);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
