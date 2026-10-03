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
  setContourRoomTyping,
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
  setContourRoomTyping: jest.fn(() => Promise.resolve()),
  subscribeToRoomGame: jest.fn(),
  subscribeToRoomPlayers: jest.fn(),
  subscribeToRoomSettings: jest.fn(),
}));

jest.mock('@/games/contour/helpers/firestoreContours', () => ({ loadRoundData: jest.fn() }));

const NAMES: Record<string, [string, string]> = { FR: ['France', 'France'], ES: ['Espagne', 'Spain'] };

/** What a round's documents give: the country with its names, one neighbor, a capital and a city (so a
 * plan with every category has 12 steps), and the rings around it. */
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
  hintPicks: [],
  typing: null,
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

  it('turns the playing order round by round: the second to arrive opens the second round', async () => {
    const { result, unmount } = await setup();
    expect(result.current.roundPlayers.map((player) => player.uid)).toEqual(['host', 'guest']);
    await unmount();
    const second = await setup({ gameState: gameState({ roundIndex: 1, turnUid: 'guest' }) });
    expect(second.result.current.roundPlayers.map((player) => player.uid)).toEqual(['guest', 'host']);
  });

  it('drops the points at stake with every hint, down to 0 once the country is revealed', async () => {
    // A room without `hintCategories` (an old one) plays every category: 12 steps for France.
    const { result } = await setup();
    expect(result.current.plan).toHaveLength(12);
    expect(result.current.pointsAtStake).toBe(MAX_CONTOUR_POINTS);
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 2 }) }));
    expect(result.current.pointsAtStake).toBe(contourGuessPoints(2, 12));
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 11 }) }));
    expect(result.current.pointsAtStake).toBe(contourGuessPoints(11, 12));
    expect(result.current.pointsAtStake).toBeGreaterThan(0);
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 12 }) }));
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
  it('reveals the next step of the group picked and hands the turn to the next player', async () => {
    const { result } = await setup({ gameState: gameState({ hintsRevealed: 1, hintPicks: ['silhouette'] }) });
    await act(async () => result.current.revealHint('cities'));
    expect(revealContourRoomHint).toHaveBeenCalledWith('tabofuna', ['silhouette', 'cities'], 'guest');
  });

  it('lets the neighbors be picked at any time, even before the outline is sharp', async () => {
    const { result } = await setup();
    await act(async () => result.current.revealHint('neighbors'));
    expect(revealContourRoomHint).toHaveBeenCalledWith('tabofuna', ['neighbors'], 'guest');
  });

  it('puts the picked steps first in the plan, in the order they were picked', async () => {
    const picks = [...Array(3).fill('silhouette'), 'neighbors', 'cities'] as ContourRoomGameState['hintPicks'];
    const { result } = await setup({ gameState: gameState({ hintsRevealed: 5, hintPicks: picks }) });
    expect(result.current.plan.slice(3, 5)).toEqual(['neighborShapes', 'cityPositions']);
    const neighbors = result.current.hintGroups.find((entry) => entry.group === 'neighbors');
    expect(neighbors?.next).toBe('neighborFlags');
  });

  it('wraps around to the first player after the last one', async () => {
    const { result } = await setup({ localUid: 'guest', gameState: gameState({ turnUid: 'guest' }) });
    await act(async () => result.current.revealHint('silhouette'));
    expect(revealContourRoomHint).toHaveBeenCalledWith('tabofuna', ['silhouette'], 'host');
  });

  it('swallows a failed write', async () => {
    jest.mocked(revealContourRoomHint).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.revealHint('silhouette'));
    expect(revealContourRoomHint).toHaveBeenCalledTimes(1);
  });

  it('is only for the turn-holder', async () => {
    const guest = await setup({ localUid: 'guest' });
    await act(async () => guest.result.current.revealHint('silhouette'));
    expect(revealContourRoomHint).not.toHaveBeenCalled();
  });

  it('does nothing for a group with no step left, and keeps the country for the end', async () => {
    const picks: ContourRoomGameState['hintPicks'] = [
      ...Array(3).fill('silhouette'),
      ...Array(4).fill('neighbors'),
      ...Array(4).fill('cities'),
    ];
    const early = await setup();
    await act(async () => early.result.current.revealHint('reveal'));
    await early.unmount();
    const allOut = await setup({ gameState: gameState({ hintsRevealed: 11, hintPicks: picks }) });
    await act(async () => allOut.result.current.revealHint('silhouette'));
    expect(revealContourRoomHint).not.toHaveBeenCalled();
    await act(async () => allOut.result.current.revealHint('reveal'));
    expect(revealContourRoomHint).toHaveBeenCalledWith('tabofuna', [...picks, 'reveal'], 'guest');
  });

  it('does nothing with nobody in the room to hand the turn to', async () => {
    const { result } = await setup({ players: {} });
    await act(async () => result.current.revealHint('silhouette'));
    expect(revealContourRoomHint).not.toHaveBeenCalled();
  });
});

describe("useOnlineContourGame — sharing this device's draft guess", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("mirrors the turn-holder's text to the room, 500ms after it stops changing", async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Fr'));
    await act(async () => jest.advanceTimersByTime(499));
    expect(setContourRoomTyping).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(1));
    expect(setContourRoomTyping).toHaveBeenCalledWith('tabofuna', 'host', 'Fr');
  });

  it('writes once per pause, and not again for an unchanged value', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('F'));
    await act(async () => jest.advanceTimersByTime(200));
    await act(async () => result.current.setGuessText('Fr'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setContourRoomTyping).toHaveBeenCalledTimes(1);
    await act(async () => jest.advanceTimersByTime(500));
    expect(setContourRoomTyping).toHaveBeenCalledTimes(1);
  });

  it('never writes for a spectator, once the round is over, or alone in the room', async () => {
    const spectator = await setup({ localUid: 'guest' });
    await act(async () => spectator.result.current.setGuessText('Fr'));
    await act(async () => jest.advanceTimersByTime(500));
    await spectator.unmount();
    const over = await setup({ gameState: gameState({ verdict: 'giveUp' }) });
    await act(async () => over.result.current.setGuessText('Fr'));
    await act(async () => jest.advanceTimersByTime(500));
    await over.unmount();
    const alone = await setup({ players: { host: { name: 'Zoé', joinedAt: arrivedAt(1) } } });
    await act(async () => alone.result.current.setGuessText('Fr'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setContourRoomTyping).not.toHaveBeenCalled();
  });

  it('swallows a failed write', async () => {
    jest.mocked(setContourRoomTyping).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Fr'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setContourRoomTyping).toHaveBeenCalledTimes(1);
  });
});

describe('useOnlineContourGame — watching the turn-holder type', () => {
  it("shows the turn-holder's live text to a spectator", async () => {
    const { result } = await setup({
      localUid: 'guest',
      gameState: gameState({ typing: { uid: 'host', text: 'Fra' } }),
    });
    expect(result.current.typedByActivePlayer).toBe('Fra');
  });

  it('shows nothing to the turn-holder themself, for a leftover of an earlier turn-holder, or once the round is over', async () => {
    const own = await setup({ gameState: gameState({ typing: { uid: 'host', text: 'Fra' } }) });
    expect(own.result.current.typedByActivePlayer).toBe('');
    await own.unmount();
    const leftover = await setup({
      localUid: 'guest',
      gameState: gameState({ turnUid: 'host', typing: { uid: 'guest', text: 'Esp' } }),
    });
    expect(leftover.result.current.typedByActivePlayer).toBe('');
    await leftover.unmount();
    const over = await setup({
      localUid: 'guest',
      gameState: gameState({ verdict: 'correct', typing: { uid: 'host', text: 'Fra' } }),
    });
    expect(over.result.current.typedByActivePlayer).toBe('');
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
  it('hands the next round to the next player in the rotation', async () => {
    jest.mocked(nextContourRoomRound).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.goToNextRound());
    expect(nextContourRoomRound).toHaveBeenCalledWith('tabofuna', 1, 2, 'guest');
  });

  it('comes back round to the first player after a full turn of the table', async () => {
    const { result } = await setup({ gameState: gameState({ roundIndex: 1, turnUid: 'guest' }) });
    await act(async () => result.current.goToNextRound());
    expect(nextContourRoomRound).toHaveBeenCalledWith('tabofuna', 2, 2, 'host');
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
      guest: contourGuessPoints(1, 12),
    });
  });

  it('hands the turn to the first player still there when the turn-holder left', async () => {
    jest.mocked(passRoomTurn).mockRejectedValueOnce(new Error('offline'));
    await setup({ gameState: gameState({ turnUid: 'ghost' }) });
    expect(passRoomTurn).toHaveBeenCalledWith('tabofuna', 'host');
  });
});
