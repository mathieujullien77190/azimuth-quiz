import { act, renderHook } from '@testing-library/react-native';

import { finishRoomRound, nextRoomRound, removeRoomPlayer, submitRoomGuess } from '@/games/compass/helpers/room';
import type { RoomGameState } from '@/games/compass/helpers/room';
import { useRoomStore } from '@/games/compass/store/roomStore';
import { DEV_CODE } from '@/data';
import { scoreRound } from '@/helpers';
import { sendDevFeedback } from '@/helpers/devFeedback';
import { useDevCode } from '@/settings';
import type { Place } from '@/types';

import { DEFAULT_BEARING } from './constants';
import { useOnlineGame } from './useOnlineGame';

jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: jest.fn() }) }));
jest.mock('@/helpers/devFeedback', () => ({ sendDevFeedback: jest.fn(() => Promise.resolve()) }));
jest.mock('@/games/compass/helpers/room', () => ({
  deleteRoom: jest.fn(() => Promise.resolve()),
  finishRoomRound: jest.fn(() => Promise.resolve()),
  nextRoomRound: jest.fn(() => Promise.resolve()),
  pruneRoomPlayerData: jest.fn(() => Promise.resolve()),
  removeRoomPlayer: jest.fn(() => Promise.resolve()),
  submitRoomGuess: jest.fn(() => Promise.resolve()),
  subscribeToRoomGame: jest.fn(),
  subscribeToRoomPlayers: jest.fn(),
  subscribeToRoomSettings: jest.fn(),
}));

const INITIAL_STATE = useRoomStore.getState();

const PARIS: Place = {
  name: 'Paris',
  code: 'FR',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  category: 'cities',
  difficulty: 'easy',
};
const ORIGIN = { name: 'Ici', coordinates: { latitude: 40, longitude: -3 }, isDevicePosition: false };
const arrivedAt = (millis: number) => ({ toMillis: () => millis }) as never;

const gameState = (overrides: Partial<RoomGameState> = {}): RoomGameState => ({
  screen: 'game',
  origin: ORIGIN,
  places: [PARIS, PARIS],
  roundIndex: 0,
  guesses: {},
  scores: null,
  totalScores: {},
  ...overrides,
});

const setRoom = (state: Partial<ReturnType<typeof useRoomStore.getState>>) => useRoomStore.setState(state);

/** Two players, `host` (this device unless said otherwise) then `guest`. */
const setup = async (state: Partial<ReturnType<typeof useRoomStore.getState>> = {}) => {
  setRoom({
    code: 'tabofuna',
    localUid: 'host',
    hostUid: 'host',
    players: {
      host: { name: 'Zoé', joinedAt: arrivedAt(1) },
      guest: { name: 'Max', joinedAt: arrivedAt(2) },
    },
    roomSettings: { difficulty: 'easy' } as never,
    gameState: gameState(),
    ...state,
  });
  return renderHook(() => useOnlineGame('tabofuna', jest.fn()));
};

beforeEach(() => {
  jest.clearAllMocks();
  useRoomStore.setState(INITIAL_STATE, true);
  useDevCode.setState({ devCode: '' });
});

describe('useOnlineGame — the draft answer', () => {
  it('starts at the default heading and distance, untouched', async () => {
    const { result } = await setup();
    expect(result.current.bearing).toBe(DEFAULT_BEARING);
    expect(result.current.bearingTouched).toBe(false);
    expect(result.current.distanceTouched).toBe(false);
    expect(result.current.place).toEqual(PARIS);
  });

  it('remembers what the player set and that they touched it', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.setBearing(123);
      result.current.setDistanceKm(4567);
    });
    expect(result.current.bearing).toBe(123);
    expect(result.current.distanceKm).toBe(4567);
    expect(result.current.bearingTouched).toBe(true);
    expect(result.current.distanceTouched).toBe(true);
  });

  it('starts over at the top of every round', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.setBearing(123);
      result.current.setDistanceKm(4567);
    });
    await act(async () => setRoom({ gameState: gameState({ roundIndex: 1 }) }));
    expect(result.current.bearing).toBe(DEFAULT_BEARING);
    expect(result.current.bearingTouched).toBe(false);
    expect(result.current.distanceTouched).toBe(false);
  });
});

describe('useOnlineGame — submitting and moving on', () => {
  it("submits this device's answer to the room", async () => {
    const { result } = await setup();
    await act(async () => result.current.setBearing(90));
    await act(async () => result.current.submit());
    expect(submitRoomGuess).toHaveBeenCalledWith('tabofuna', 'host', { bearing: 90, distanceKm: 1000 });
  });

  it('swallows a failed submission', async () => {
    jest.mocked(submitRoomGuess).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.submit());
    expect(submitRoomGuess).toHaveBeenCalledTimes(1);
  });

  it('submits nothing before the local uid is known', async () => {
    const { result } = await setup({ localUid: null });
    await act(async () => result.current.submit());
    expect(submitRoomGuess).not.toHaveBeenCalled();
  });

  it('goes to the next round', async () => {
    jest.mocked(nextRoomRound).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.goToNextRound());
    expect(nextRoomRound).toHaveBeenCalledWith('tabofuna', 1, 2);
  });
});

describe('useOnlineGame — who is who', () => {
  it("lists every player's running total, in arrival order, and finds this device", async () => {
    const { result } = await setup({
      localUid: 'guest',
      gameState: gameState({ totalScores: { host: 300, guest: 120 } }),
    });
    expect(result.current.totals).toEqual([300, 120]);
    expect(result.current.myIndex).toBe(1);
  });

  it('counts 0 for a player with no total yet', async () => {
    const { result } = await setup();
    expect(result.current.totals).toEqual([0, 0]);
  });
});

describe('useOnlineGame — kicking', () => {
  it('is only offered to the host', async () => {
    const { result } = await setup({ localUid: 'guest' });
    expect(result.current.kickPlayer).toBeUndefined();
  });

  it('removes another player from the room, even if the write fails', async () => {
    jest.mocked(removeRoomPlayer).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.kickPlayer?.(1));
    expect(removeRoomPlayer).toHaveBeenCalledWith('tabofuna', 'guest');
  });

  it('never removes the host itself, nor an unknown index', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.kickPlayer?.(0);
      result.current.kickPlayer?.(9);
    });
    expect(removeRoomPlayer).not.toHaveBeenCalled();
  });
});

describe('useOnlineGame — the round history', () => {
  const scores = () => ({
    host: scoreRound(ORIGIN.coordinates, PARIS, { bearing: 0, distanceKm: 1 }),
    guest: scoreRound(ORIGIN.coordinates, PARIS, { bearing: 0, distanceKm: 1 }),
  });

  it('records a revealed round once', async () => {
    const { result } = await setup();
    const revealed = gameState({
      screen: 'reveal',
      guesses: { host: { bearing: 0, distanceKm: 1 }, guest: { bearing: 0, distanceKm: 1 } },
      scores: scores(),
    });
    await act(async () => setRoom({ gameState: revealed }));
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].place).toEqual(PARIS);
    expect(result.current.records[0].results).toHaveLength(2);

    // Same round again (a fresh snapshot): not recorded twice.
    await act(async () => setRoom({ gameState: { ...revealed, guesses: { ...revealed.guesses } } }));
    expect(result.current.records).toHaveLength(1);
  });

  it('records nothing while the round is still being played', async () => {
    const { result } = await setup();
    expect(result.current.records).toEqual([]);
  });
});

describe('useOnlineGame — scoring the round (host only)', () => {
  const answered = {
    host: { bearing: 0, distanceKm: 1 },
    guest: { bearing: 90, distanceKm: 500 },
  };

  it('scores the round as soon as everyone has answered', async () => {
    await setup({ gameState: gameState({ guesses: answered, totalScores: { host: 10 } }) });
    expect(finishRoomRound).toHaveBeenCalledTimes(1);
    const [code, scores, totals] = jest.mocked(finishRoomRound).mock.calls[0];
    expect(code).toBe('tabofuna');
    expect(Object.keys(scores).sort()).toEqual(['guest', 'host']);
    expect(totals.host).toBe(10 + scores.host.total);
    expect(totals.guest).toBe(scores.guest.total);
  });

  it('in travel mode, scores a later round from the previous place, not from the starting point', async () => {
    const ROME: Place = { ...PARIS, name: 'Rome', coordinates: { latitude: 41.9, longitude: 12.5 } };
    await setup({
      roomSettings: { difficulty: 'easy', travel: true } as never,
      gameState: gameState({ places: [ROME, PARIS], roundIndex: 1, guesses: answered }),
    });
    const [, scores] = jest.mocked(finishRoomRound).mock.calls[0];
    const expected = scoreRound(ROME.coordinates, PARIS, answered.host);
    expect(scores.host.trueSurfaceDistanceKm).toBe(expected.trueSurfaceDistanceKm);
    expect(scores.host.trueBearing).toBe(expected.trueBearing);
    expect(scores.host.trueSurfaceDistanceKm).not.toBe(scoreRound(ORIGIN.coordinates, PARIS, answered.host).trueSurfaceDistanceKm);
  });

  it('scores a round only once', async () => {
    await setup({ gameState: gameState({ guesses: answered }) });
    await act(async () => setRoom({ gameState: gameState({ guesses: answered, totalScores: { host: 1 } }) }));
    expect(finishRoomRound).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed write', async () => {
    jest.mocked(finishRoomRound).mockRejectedValueOnce(new Error('offline'));
    await setup({ gameState: gameState({ guesses: answered }) });
    expect(finishRoomRound).toHaveBeenCalledTimes(1);
  });

  it('waits for every connected player', async () => {
    await setup({ gameState: gameState({ guesses: { host: answered.host } }) });
    expect(finishRoomRound).not.toHaveBeenCalled();
  });

  it('is left to the host', async () => {
    await setup({ localUid: 'guest', gameState: gameState({ guesses: answered }) });
    expect(finishRoomRound).not.toHaveBeenCalled();
  });

  it('does nothing outside the answering screen', async () => {
    await setup({ gameState: gameState({ screen: 'reveal', guesses: answered }) });
    expect(finishRoomRound).not.toHaveBeenCalled();
  });

  it('does nothing before the origin is known', async () => {
    await setup({ gameState: gameState({ origin: null, guesses: answered }) });
    expect(finishRoomRound).not.toHaveBeenCalled();
  });

  it('does nothing with nobody in the room', async () => {
    await setup({ players: {}, gameState: gameState() });
    expect(finishRoomRound).not.toHaveBeenCalled();
  });
});

describe('useOnlineGame — the dev mode difficulty question', () => {
  const LYON = { ...PARIS, name: 'Lyon' };
  const places = [{ ...PARIS, key: 'par' }, LYON];
  const nextRound = (overrides: Partial<RoomGameState> = {}) =>
    act(async () => setRoom({ gameState: gameState({ screen: 'game', roundIndex: 1, places, ...overrides }) }));

  it('does not ask over the reveal, asks about the previous place once the host moved on, and writes the answer against its key', async () => {
    useDevCode.setState({ devCode: DEV_CODE });
    const { result } = await setup({ gameState: gameState({ screen: 'reveal', places }) });
    expect(result.current.devFeedback.question).toBeNull();

    await nextRound();
    expect(result.current.devFeedback.question).toBe('Le lieu Paris était-il…');
    await act(async () => result.current.devFeedback.choose('hard'));
    expect(sendDevFeedback).toHaveBeenCalledWith({
      game: 'compass',
      targetType: 'place',
      targetKey: 'par',
      name: 'Paris',
      currentDifficulty: 'easy',
      suggestedDifficulty: 'hard',
    });
    expect(result.current.devFeedback.question).toBeNull();
  });

  it('asks about the last round on the end screen, once', async () => {
    useDevCode.setState({ devCode: DEV_CODE });
    const { result } = await setup({ gameState: gameState({ screen: 'reveal', roundIndex: 1, places }) });
    await act(async () => setRoom({ gameState: gameState({ screen: 'end', roundIndex: 2, places }) }));
    expect(result.current.devFeedback.question).toBe('Le lieu Lyon était-il…');
    await act(async () => result.current.devFeedback.dismiss());
    expect(result.current.devFeedback.question).toBeNull();
  });

  it('falls back on the name for a place written without its key', async () => {
    useDevCode.setState({ devCode: DEV_CODE });
    const { result } = await setup({ gameState: gameState({ screen: 'reveal', places: [PARIS, LYON] }) });
    await nextRound({ places: [PARIS, LYON] });
    await act(async () => result.current.devFeedback.choose('easy'));
    expect(jest.mocked(sendDevFeedback).mock.calls[0][0].targetKey).toBe('Paris');
  });

  it('asks nothing while the round is played, without the dev code, or while there is no place', async () => {
    useDevCode.setState({ devCode: DEV_CODE });
    expect((await setup()).result.current.devFeedback.question).toBeNull();

    useDevCode.setState({ devCode: '' });
    const off = await setup({ gameState: gameState({ screen: 'reveal', places }) });
    await nextRound();
    expect(off.result.current.devFeedback.question).toBeNull();

    useDevCode.setState({ devCode: DEV_CODE });
    const none = await setup({ gameState: gameState({ screen: 'reveal', places: [] }) });
    expect(none.result.current.devFeedback.question).toBeNull();
  });
});
