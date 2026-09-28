import { onSnapshot, updateDoc } from 'firebase/firestore';

import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import type { CluePlace, Origin } from '@/types';

import {
  applyClueRoomScore,
  clueRoomSettingsFrom,
  giveUpClueRoom,
  nextClueRoomRound,
  pickClueRoomClue,
  reportClueRoomCorrect,
  reportClueRoomWrong,
  setClueRoomTyping,
  startClueRoomGame,
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
const ORIGIN = { name: 'Paris' } as Origin;
const PLACES = [{ name: 'Rome' }] as CluePlace[];

beforeEach(() => jest.clearAllMocks());

describe('clueRoomSettingsFrom', () => {
  it('shares every setting except the local player names', () => {
    const shared = clueRoomSettingsFrom(DEFAULT_CLUE_SETTINGS);
    expect(shared).not.toHaveProperty('playerName');
    expect(shared).toMatchObject({ rounds: DEFAULT_CLUE_SETTINGS.rounds });
  });
});

describe('game writes', () => {
  it('startClueRoomGame seeds the board, giving the first turn and the first letter when asked', async () => {
    await startClueRoomGame('tabofuna', { origin: ORIGIN, places: PLACES }, 'zoe', true);
    expect(updateDoc).toHaveBeenCalledWith(REF, {
      screen: 'game',
      origin: ORIGIN,
      places: PLACES,
      roundIndex: 0,
      revealedClueIds: ['letter'],
      turnUid: 'zoe',
      verdict: null,
      roundWinnerUid: null,
      wrongGuessUid: null,
      wrongGuessSeq: 0,
      totalScores: {},
      typing: null,
    });
  });

  it('startClueRoomGame starts without any clue when the first letter is off', async () => {
    await startClueRoomGame('tabofuna', { origin: ORIGIN, places: PLACES }, 'zoe', false);
    expect(jest.mocked(updateDoc).mock.calls[0][1]).toMatchObject({ revealedClueIds: [] });
  });

  it('pickClueRoomClue writes the appended clues and hands the turn over', async () => {
    await pickClueRoomClue('tabofuna', ['distance', 'distance'], 'max');
    expect(updateDoc).toHaveBeenCalledWith(REF, { revealedClueIds: ['distance', 'distance'], turnUid: 'max' });
  });

  it('setClueRoomTyping mirrors the turn-holder\'s in-progress text', async () => {
    await setClueRoomTyping('tabofuna', 'zoe', 'Pari');
    expect(updateDoc).toHaveBeenCalledWith(REF, { typing: { uid: 'zoe', text: 'Pari' } });
  });

  it('reportClueRoomCorrect names the winner', async () => {
    await reportClueRoomCorrect('tabofuna', 'zoe');
    expect(updateDoc).toHaveBeenCalledWith(REF, { verdict: 'correct', roundWinnerUid: 'zoe' });
  });

  it('giveUpClueRoom ends the round without a winner', async () => {
    await giveUpClueRoom('tabofuna');
    expect(updateDoc).toHaveBeenCalledWith(REF, { verdict: 'giveUp' });
  });

  it('reportClueRoomWrong reports the miss with its sequence number', async () => {
    await reportClueRoomWrong('tabofuna', 'zoe', 3);
    expect(updateDoc).toHaveBeenCalledWith(REF, { wrongGuessUid: 'zoe', wrongGuessSeq: 3 });
  });

  it('applyClueRoomScore writes the running totals', async () => {
    await applyClueRoomScore('tabofuna', { zoe: 12 });
    expect(updateDoc).toHaveBeenCalledWith(REF, { totalScores: { zoe: 12 } });
  });

  it('nextClueRoomRound resets the board while places remain', async () => {
    await nextClueRoomRound('tabofuna', 2, 5, 'zoe', true);
    expect(updateDoc).toHaveBeenCalledWith(REF, {
      screen: 'game',
      roundIndex: 2,
      revealedClueIds: ['letter'],
      turnUid: 'zoe',
      verdict: null,
      roundWinnerUid: null,
      typing: null,
    });
  });

  it('nextClueRoomRound ends the game past the last place', async () => {
    await nextClueRoomRound('tabofuna', 5, 5, 'zoe', false);
    expect(jest.mocked(updateDoc).mock.calls[0][1]).toMatchObject({ screen: 'end', revealedClueIds: [] });
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
      origin: ORIGIN,
      places: PLACES,
      roundIndex: 1,
      revealedClueIds: ['distance'],
      turnUid: 'zoe',
      verdict: 'correct',
      roundWinnerUid: 'zoe',
      wrongGuessUid: 'max',
      wrongGuessSeq: 2,
      totalScores: { zoe: 5 },
      typing: { uid: 'zoe', text: 'Pari' },
    };
    emit(true, state);
    const onUpdate = jest.fn();
    subscribeToRoomGame('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith(state);
  });

  it('falls back to lobby defaults for missing fields', () => {
    emit(true, {});
    const onUpdate = jest.fn();
    subscribeToRoomGame('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({
      screen: 'options',
      origin: null,
      places: [],
      roundIndex: 0,
      revealedClueIds: [],
      turnUid: null,
      verdict: null,
      roundWinnerUid: null,
      wrongGuessUid: null,
      wrongGuessSeq: 0,
      totalScores: {},
      typing: null,
    });
  });

  it('reports nothing once the room is gone, and returns the unsubscribe', () => {
    const unsubscribe = emit(false);
    const onUpdate = jest.fn();
    expect(subscribeToRoomGame('tabofuna', onUpdate)).toBe(unsubscribe);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
