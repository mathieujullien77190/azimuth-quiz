import { act, renderHook } from '@testing-library/react-native';

import { CONTOUR_GUESS_POINTS_BY_HINTS } from '@/games/contour/constants';
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
const setup = async (state: Partial<StoreState> = {}) => {
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
  return renderHook(() => useOnlineContourGame('tabofuna', jest.fn()));
};

beforeEach(() => {
  jest.clearAllMocks();
  useContourRoomStore.setState(INITIAL_STATE, true);
});

describe('useOnlineContourGame — the round', () => {
  it("rebuilds the board of the round's country from its code", async () => {
    const { result } = await setup();
    expect(result.current.country?.code).toBe('FR');
    expect(result.current.isMyTurn).toBe(true);
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

  it('drops the points at stake with every hint, down to 0 once the name is out', async () => {
    const { result } = await setup();
    expect(result.current.pointsAtStake).toBe(CONTOUR_GUESS_POINTS_BY_HINTS[0]);
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 2 }) }));
    expect(result.current.pointsAtStake).toBe(CONTOUR_GUESS_POINTS_BY_HINTS[2]);
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 6 }) }));
    expect(result.current.pointsAtStake).toBe(CONTOUR_GUESS_POINTS_BY_HINTS[6]);
    await act(async () => useContourRoomStore.setState({ gameState: gameState({ hintsRevealed: 7 }) }));
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
    const allOut = await setup({ gameState: gameState({ hintsRevealed: 7 }) });
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
    await setup({
      gameState: gameState({ verdict: 'correct', roundWinnerUid: 'guest', hintsRevealed: 1, totalScores: { host: 5 } }),
    });
    expect(applyContourRoomScore).toHaveBeenCalledWith('tabofuna', {
      host: 5,
      guest: CONTOUR_GUESS_POINTS_BY_HINTS[1],
    });
  });

  it('hands the turn to the first player still there when the turn-holder left', async () => {
    jest.mocked(passRoomTurn).mockRejectedValueOnce(new Error('offline'));
    await setup({ gameState: gameState({ turnUid: 'ghost' }) });
    expect(passRoomTurn).toHaveBeenCalledWith('tabofuna', 'host');
  });
});
