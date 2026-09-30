import { act, renderHook, waitFor } from '@testing-library/react-native';

import { MAX_CONTOUR_POINTS } from '@/games/contour/constants';
import { loadRoundData } from '@/games/contour/helpers/firestoreContours';
import { contourGuessPoints } from '@/games/contour/helpers/hintPlan';
import {
  applyContourRoomScore,
  giveUpContourRoom,
  nextContourRoomRound,
  passRoomTurn,
  reportContourRoomCorrect,
  reportContourRoomWrong,
  revealContourRoomHint,
} from '@/games/contour/helpers/room';
import type { ContourRoomGameState } from '@/games/contour/helpers/room';
import { roundSimplifySeed } from '@/games/contour/helpers/simplify';
import { useContourRoomStore } from '@/games/contour/store/roomStore';

import { useOnlineContourGame } from './useOnlineContourGame';

jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: jest.fn() }) }));
jest.mock('@/games/contour/helpers/room', () => ({
  applyContourRoomScore: jest.fn(() => Promise.resolve()),
  deleteRoom: jest.fn(() => Promise.resolve()),
  giveUpContourRoom: jest.fn(() => Promise.resolve()),
  nextContourRoomRound: jest.fn(() => Promise.resolve()),
  passRoomTurn: jest.fn(() => Promise.resolve()),
  pruneRoomPlayerData: jest.fn(() => Promise.resolve()),
  removeRoomPlayer: jest.fn(() => Promise.resolve()),
  reportContourRoomCorrect: jest.fn(() => Promise.resolve()),
  reportContourRoomWrong: jest.fn(() => Promise.resolve()),
  revealContourRoomHint: jest.fn(() => Promise.resolve()),
  subscribeToRoomGame: jest.fn(),
  subscribeToRoomPlayers: jest.fn(),
  subscribeToRoomSettings: jest.fn(),
}));

jest.mock('@/games/contour/helpers/firestoreContours', () => ({ loadRoundData: jest.fn() }));

const NAMES: Record<string, [string, string]> = { FR: ['France', 'France'], ES: ['Espagne', 'Spain'] };

/** What a round's documents give: the country with its names, one neighbor, a capital and a city (so a
 * plan with every category has 11 steps), and the rings around it. */
const roundData = (code: string) => ({
  country: {
    code,
    fr: NAMES[code][0],
    en: NAMES[code][1],
    points: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ] as [number, number][],
    neighbors: [{ type: 'country' as const, code: 'BB', x: 0.1, y: 0.1, fr: 'Bb', en: 'Bb' }],
    centerLabel: { x: 0.5, y: 0.5 },
    difficulty: 'easy' as const,
    capital: { name: 'Capitale', longitude: 0.5, latitude: 0.5 },
    cities: [{ name: 'Ville', longitude: 0.4, latitude: 0.4 }],
  },
  neighborCountries: [],
});

const INITIAL_STATE = useContourRoomStore.getState();

const arrivedAt = (millis: number) => ({ toMillis: () => millis }) as never;

type StoreState = ReturnType<typeof useContourRoomStore.getState>;

const gameState = (overrides: Partial<ContourRoomGameState> = {}): ContourRoomGameState => ({
  screen: 'game',
  countryCodes: ['FR', 'ES'],
  simplifySeed: 3,
  roundIndex: 0,
  hintsRevealed: 0,
  turnUid: 'host',
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  totalScores: {},
  ...overrides,
});

/** Two players, `host` (this device unless said otherwise) then `guest`; it is the host's turn. */
const setup = async (state: Partial<StoreState> = {}, waitForCountry = true) => {
  useContourRoomStore.setState({
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
  const hook = await renderHook(() => useOnlineContourGame('tabofuna', jest.fn()));
  // The round's documents come from Firestore: wait for them when the room has a round to play.
  const { countryCodes, roundIndex } = (state.gameState ?? gameState()) as ContourRoomGameState;
  if (waitForCountry && countryCodes[roundIndex] !== undefined)
    await waitFor(() => expect(hook.result.current.country).toBeDefined());
  return hook;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadRoundData).mockImplementation(async (code) => roundData(code));
  useContourRoomStore.setState(INITIAL_STATE, true);
});

describe('useOnlineContourGame — the round', () => {
  it("rebuilds the board of the round's country from its code", async () => {
    const { result } = await setup();
    expect(result.current.country?.code).toBe('FR');
    expect(result.current.isMyTurn).toBe(true);
  });

  it('reads the next round in the background while this one is played', async () => {
    await setup();
    expect(loadRoundData).toHaveBeenCalledWith('FR');
    expect(loadRoundData).toHaveBeenCalledWith('ES');
  });

  it('reports a round that could not be read, and reads it again on demand', async () => {
    jest.mocked(loadRoundData).mockRejectedValue(new Error('offline'));
    const { result } = await setup({}, false);
    await waitFor(() => expect(result.current.roundFailed).toBe(true));
    expect(result.current.country).toBeUndefined();

    jest.mocked(loadRoundData).mockImplementation(async (code) => roundData(code));
    await act(async () => result.current.retryRound());
    await waitFor(() => expect(result.current.country?.code).toBe('FR'));
    expect(result.current.roundFailed).toBe(false);
  });

  it('has no country for an unknown code', async () => {
    const { result } = await setup({ gameState: gameState({ countryCodes: [] }) });
    expect(result.current.country).toBeUndefined();
  });

  it('knows whose turn it is', async () => {
    const { result, unmount } = await setup({ localUid: 'guest' });
    expect(result.current.isMyTurn).toBe(false);
    await unmount();
    const noUid = await setup({ localUid: null });
    expect(noUid.result.current.isMyTurn).toBe(false);
    await noUid.unmount();
    const noTurn = await setup({ gameState: gameState({ turnUid: null }) });
    expect(noTurn.result.current.isMyTurn).toBe(false);
  });

  it('drops the points at stake with every hint, down to 0 once the country is revealed', async () => {
    // A room without `hintCategories` (an old one) plays every category: 11 steps for France.
    const { result } = await setup();
    expect(result.current.plan).toHaveLength(11);
    expect(result.current.pointsAtStake).toBe(MAX_CONTOUR_POINTS);
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 2 }) }));
    expect(result.current.pointsAtStake).toBe(contourGuessPoints(2, 11));
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 10 }) }));
    expect(result.current.pointsAtStake).toBe(contourGuessPoints(10, 11));
    expect(result.current.pointsAtStake).toBeGreaterThan(0);
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 11 }) }));
    expect(result.current.pointsAtStake).toBe(0);
  });
});

describe('useOnlineContourGame — the hint plan', () => {
  it('follows the categories the host picked in the room settings', async () => {
    const { result } = await setup({ roomSettings: { difficulty: 'easy', hintCategories: ['capital'] } as never });
    expect(result.current.plan).toEqual(['capitalPosition', 'capitalName', 'reveal']);
  });

  it('scales the points to the length of the plan', async () => {
    const { result } = await setup({
      roomSettings: { difficulty: 'easy', hintCategories: ['capital'] } as never,
      gameState: gameState({ hintsRevealed: 1 }),
    });
    expect(result.current.pointsAtStake).toBe(contourGuessPoints(1, 3));
  });

  it('is the same list on every device for the same room settings and country', async () => {
    const roomSettings = { difficulty: 'easy', hintCategories: ['silhouette', 'cities'] } as never;
    const first = await setup({ roomSettings });
    const plan = first.result.current.plan;
    await first.unmount();
    const second = await setup({ roomSettings, localUid: 'guest' });
    expect(second.result.current.plan).toEqual(plan);
  });

  it('has an empty plan (no points) while the round country is unknown', async () => {
    const { result } = await setup({ gameState: gameState({ countryCodes: [] }) });
    expect(result.current.plan).toEqual([]);
    expect(result.current.pointsAtStake).toBe(0);
  });
});

describe('useOnlineContourGame — the simplification seed', () => {
  it('derives the round seed from the room seed, the round and the country', async () => {
    const { result } = await setup();
    expect(result.current.simplifySeed).toBe(roundSimplifySeed(3, 0, 'FR'));
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ roundIndex: 1 }) }));
    expect(result.current.simplifySeed).toBe(roundSimplifySeed(3, 1, 'ES'));
  });

  it('still gives a seed when no country is loaded yet', async () => {
    const { result } = await setup({ gameState: gameState({ countryCodes: [] }) });
    expect(result.current.simplifySeed).toBe(roundSimplifySeed(3, 0, ''));
  });
});

describe('useOnlineContourGame — the draft guess', () => {
  it('keeps what is typed, until the turn passes to someone else', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Fra'));
    expect(result.current.guessText).toBe('Fra');
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ turnUid: 'guest' }) }));
    expect(result.current.guessText).toBe('');
    expect(result.current.lastWrong).toBeNull();
  });
});

describe('useOnlineContourGame — revealing a hint', () => {
  it('reveals the next tier and hands the turn to the next player', async () => {
    const { result } = await setup({ gameState: gameState({ hintsRevealed: 1 }) });
    await act(async () => result.current.revealHint());
    expect(revealContourRoomHint).toHaveBeenCalledWith('tabofuna', 2, 'guest');
  });

  it('wraps around to the first player after the last one', async () => {
    const { result } = await setup({ localUid: 'guest', gameState: gameState({ turnUid: 'guest' }) });
    await act(async () => result.current.revealHint());
    expect(revealContourRoomHint).toHaveBeenCalledWith('tabofuna', 1, 'host');
  });

  it('swallows a failed write', async () => {
    jest.mocked(revealContourRoomHint).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.revealHint());
    expect(revealContourRoomHint).toHaveBeenCalledTimes(1);
  });

  it('is only for the turn-holder, and only until the name is out', async () => {
    const guest = await setup({ localUid: 'guest' });
    await act(async () => guest.result.current.revealHint());
    await guest.unmount();
    const allOut = await setup({ gameState: gameState({ hintsRevealed: 11 }) });
    await act(async () => allOut.result.current.revealHint());
    expect(revealContourRoomHint).not.toHaveBeenCalled();
  });

  it('does nothing with nobody in the room to hand the turn to', async () => {
    const { result } = await setup({ players: {} });
    await act(async () => result.current.revealHint());
    expect(revealContourRoomHint).not.toHaveBeenCalled();
  });
});

describe('useOnlineContourGame — guessing', () => {
  it('reports a right answer, however it is typed', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('  france '));
    await act(async () => result.current.submitGuess());
    expect(reportContourRoomCorrect).toHaveBeenCalledWith('tabofuna', 'host');
    expect(reportContourRoomWrong).not.toHaveBeenCalled();
  });

  it('swallows a failed report of a right answer', async () => {
    jest.mocked(reportContourRoomCorrect).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.setGuessText('France'));
    await act(async () => result.current.submitGuess());
    expect(reportContourRoomCorrect).toHaveBeenCalledTimes(1);
  });

  it('reports a wrong answer, empties the field and remembers who missed', async () => {
    const { result } = await setup({ gameState: gameState({ wrongGuessSeq: 2 }) });
    await act(async () => result.current.setGuessText('Espagne'));
    await act(async () => result.current.submitGuess());
    expect(reportContourRoomWrong).toHaveBeenCalledWith('tabofuna', 'host', 3);
    expect(result.current.guessText).toBe('');
    expect(result.current.lastWrong).toBe('Zoé');
  });

  it('names nobody when this device is not in the players list', async () => {
    const { result } = await setup({ players: { guest: { name: 'Max', joinedAt: arrivedAt(2) } } });
    await act(async () => result.current.setGuessText('Espagne'));
    await act(async () => result.current.submitGuess());
    expect(result.current.lastWrong).toBe('');
  });

  it('swallows a failed report of a wrong answer', async () => {
    jest.mocked(reportContourRoomWrong).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Espagne'));
    await act(async () => result.current.submitGuess());
    expect(reportContourRoomWrong).toHaveBeenCalledTimes(1);
  });

  it('is only for the turn-holder, once the country is known', async () => {
    const guest = await setup({ localUid: 'guest' });
    await act(async () => guest.result.current.submitGuess());
    await guest.unmount();
    const noCountry = await setup({ gameState: gameState({ countryCodes: [] }) });
    await act(async () => noCountry.result.current.submitGuess());
    expect(reportContourRoomCorrect).not.toHaveBeenCalled();
    expect(reportContourRoomWrong).not.toHaveBeenCalled();
  });

  it('gives up for the turn-holder only', async () => {
    jest.mocked(giveUpContourRoom).mockRejectedValueOnce(new Error('offline'));
    const { result, unmount } = await setup();
    await act(async () => result.current.giveUp());
    expect(giveUpContourRoom).toHaveBeenCalledWith('tabofuna');
    await unmount();

    const guest = await setup({ localUid: 'guest' });
    await act(async () => guest.result.current.giveUp());
    expect(giveUpContourRoom).toHaveBeenCalledTimes(1);
  });
});

describe('useOnlineContourGame — next round', () => {
  it('lets the host start the next round with the first player', async () => {
    jest.mocked(nextContourRoomRound).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.goToNextRound());
    expect(nextContourRoomRound).toHaveBeenCalledWith('tabofuna', 1, 2, 'host');
  });

  it('is left to the host', async () => {
    const { result } = await setup({ localUid: 'guest' });
    await act(async () => result.current.goToNextRound());
    expect(nextContourRoomRound).not.toHaveBeenCalled();
  });

  it('does nothing with nobody in the room', async () => {
    const { result } = await setup({ players: {} });
    await act(async () => result.current.goToNextRound());
    expect(nextContourRoomRound).not.toHaveBeenCalled();
  });
});

describe('useOnlineContourGame — host duties', () => {
  it('writes the total once the turn-holder found the country', async () => {
    // The round's country is loaded (so is its plan) well before somebody finds it.
    await setup({ gameState: gameState({ hintsRevealed: 1, totalScores: { host: 5 } }) });
    await act(async () =>
      useContourRoomStore.setState({
        gameState: gameState({
          verdict: 'correct',
          roundWinnerUid: 'guest',
          hintsRevealed: 1,
          totalScores: { host: 5 },
        }),
      }),
    );
    expect(applyContourRoomScore).toHaveBeenCalledWith('tabofuna', {
      host: 5,
      guest: contourGuessPoints(1, 11),
    });
  });

  it('hands the turn to the first player still there when the turn-holder left', async () => {
    jest.mocked(passRoomTurn).mockRejectedValueOnce(new Error('offline'));
    await setup({ gameState: gameState({ turnUid: 'ghost' }) });
    expect(passRoomTurn).toHaveBeenCalledWith('tabofuna', 'host');
  });
});
