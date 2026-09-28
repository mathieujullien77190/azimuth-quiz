import { onSnapshot, updateDoc } from 'firebase/firestore';

import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import type { Guess, Origin, Place, RoundScore } from '@/types';

import {
  finishRoomRound,
  nextRoomRound,
  roomSettingsFrom,
  startRoomGame,
  submitRoomGuess,
  subscribeToRoomGame,
} from './room';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(() => 'DELETE_FIELD'),
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
const PLACES = [{ name: 'Rome' }] as Place[];

beforeEach(() => jest.clearAllMocks());

describe('roomSettingsFrom', () => {
  it('shares every setting except the local player names', () => {
    const shared = roomSettingsFrom(DEFAULT_SETTINGS);
    expect(shared).not.toHaveProperty('playerName');
    expect(shared).toMatchObject({ rounds: DEFAULT_SETTINGS.rounds, difficulty: DEFAULT_SETTINGS.difficulty });
  });
});

describe('game writes', () => {
  it('startRoomGame seeds the game and flips the room to the game screen', async () => {
    await startRoomGame('tabofuna', { origin: ORIGIN, places: PLACES });
    expect(updateDoc).toHaveBeenCalledWith(REF, {
      screen: 'game',
      origin: ORIGIN,
      places: PLACES,
      roundIndex: 0,
      guesses: {},
      scores: 'DELETE_FIELD',
      totalScores: {},
    });
  });

  it('submitRoomGuess writes only this uid guess', async () => {
    const guess = { bearing: 90, distanceKm: 100 } as Guess;
    await submitRoomGuess('tabofuna', 'zoe', guess);
    expect(updateDoc).toHaveBeenCalledWith(REF, { 'guesses.zoe': guess });
  });

  it('finishRoomRound writes the scores and flips to the reveal screen', async () => {
    const scores = { zoe: {} } as unknown as Record<string, RoundScore>;
    await finishRoomRound('tabofuna', scores, { zoe: 10 });
    expect(updateDoc).toHaveBeenCalledWith(REF, { screen: 'reveal', scores, totalScores: { zoe: 10 } });
  });

  it('nextRoomRound goes back to the game screen while places remain', async () => {
    await nextRoomRound('tabofuna', 1, 5);
    expect(updateDoc).toHaveBeenCalledWith(REF, {
      screen: 'game',
      roundIndex: 1,
      guesses: {},
      scores: 'DELETE_FIELD',
    });
  });

  it('nextRoomRound ends the game past the last place', async () => {
    await nextRoomRound('tabofuna', 5, 5);
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
    emit(true, {
      screen: 'reveal',
      origin: ORIGIN,
      places: PLACES,
      roundIndex: 2,
      guesses: { zoe: { bearing: 1 } },
      scores: { zoe: { points: 5 } },
      totalScores: { zoe: 5 },
    });
    const onUpdate = jest.fn();
    subscribeToRoomGame('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({
      screen: 'reveal',
      origin: ORIGIN,
      places: PLACES,
      roundIndex: 2,
      guesses: { zoe: { bearing: 1 } },
      scores: { zoe: { points: 5 } },
      totalScores: { zoe: 5 },
    });
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
      guesses: {},
      scores: null,
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
