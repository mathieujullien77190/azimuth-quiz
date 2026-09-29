import { act, renderHook } from '@testing-library/react-native';

import {
  applyClueRoomScore,
  giveUpClueRoom,
  nextClueRoomRound,
  passRoomTurn,
  pickClueRoomClue,
  reportClueRoomCorrect,
  reportClueRoomWrong,
  setClueRoomTyping,
} from '@/games/clues/helpers/room';
import type { ClueRoomGameState } from '@/games/clues/helpers/room';
import { useClueRoomStore } from '@/games/clues/store/roomStore';
import type { ClueId } from '@/types';

import { useOnlineClueGame } from './useOnlineClueGame';

jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: jest.fn() }) }));
jest.mock('@/games/clues/helpers/room', () => ({
  applyClueRoomScore: jest.fn(() => Promise.resolve()),
  deleteRoom: jest.fn(() => Promise.resolve()),
  giveUpClueRoom: jest.fn(() => Promise.resolve()),
  nextClueRoomRound: jest.fn(() => Promise.resolve()),
  passRoomTurn: jest.fn(() => Promise.resolve()),
  pickClueRoomClue: jest.fn(() => Promise.resolve()),
  pruneRoomPlayerData: jest.fn(() => Promise.resolve()),
  removeRoomPlayer: jest.fn(() => Promise.resolve()),
  reportClueRoomCorrect: jest.fn(() => Promise.resolve()),
  reportClueRoomWrong: jest.fn(() => Promise.resolve()),
  setClueRoomTyping: jest.fn(() => Promise.resolve()),
  subscribeToRoomGame: jest.fn(),
  subscribeToRoomPlayers: jest.fn(),
  subscribeToRoomSettings: jest.fn(),
}));

const INITIAL_STATE = useClueRoomStore.getState();

const PARIS = { name: 'Paris', coordinates: { latitude: 48.8566, longitude: 2.3522 }, syllables: [] } as never;
const ORIGIN = { name: 'Ici', coordinates: { latitude: 40, longitude: -3 }, isDevicePosition: false };
const arrivedAt = (millis: number) => ({ toMillis: () => millis }) as never;

type StoreState = ReturnType<typeof useClueRoomStore.getState>;

const gameState = (overrides: Partial<ClueRoomGameState> = {}): ClueRoomGameState => ({
  screen: 'game',
  origin: ORIGIN,
  places: [PARIS, PARIS],
  roundIndex: 0,
  revealedClueIds: [],
  turnUid: 'host',
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  totalScores: {},
  typing: null,
  ...overrides,
});

/** Two players, `host` (this device unless said otherwise) then `guest`; it is the host's turn. */
const setup = async (state: Partial<StoreState> = {}) => {
  useClueRoomStore.setState({
    code: 'tabofuna',
    localUid: 'host',
    hostUid: 'host',
    players: {
      host: { name: 'Zoé', joinedAt: arrivedAt(1) },
      guest: { name: 'Max', joinedAt: arrivedAt(2) },
    },
    roomSettings: { startWithFirstLetter: false } as never,
    gameState: gameState(),
    ...state,
  });
  return renderHook(() => useOnlineClueGame('tabofuna', jest.fn()));
};

const setGame = (overrides: Partial<ClueRoomGameState>) =>
  act(async () => useClueRoomStore.setState({ gameState: gameState(overrides) }));

beforeEach(() => {
  jest.clearAllMocks();
  useClueRoomStore.setState(INITIAL_STATE, true);
});

describe('useOnlineClueGame — the round', () => {
  it('knows the place, and how far and which way it is from the origin', async () => {
    const { result } = await setup();
    expect(result.current.place).toBe(PARIS);
    expect(result.current.distance).toBeGreaterThan(0);
    expect(result.current.bearing).not.toBe(0);
    expect(result.current.isMyTurn).toBe(true);
    expect(result.current.remaining).toBeGreaterThan(0);
  });

  it('has no distance nor heading before the origin is known', async () => {
    const { result } = await setup({ gameState: gameState({ origin: null }) });
    expect(result.current.distance).toBe(0);
    expect(result.current.bearing).toBe(0);
  });

  it('knows whose turn it is', async () => {
    const { result, unmount } = await setup({ localUid: 'guest' });
    expect(result.current.isMyTurn).toBe(false);
    await unmount();
    const noUid = await setup({ localUid: null });
    expect(noUid.result.current.isMyTurn).toBe(false);
  });

  it('has nobody to play while no turn is set', async () => {
    const { result } = await setup({ gameState: gameState({ turnUid: null }) });
    expect(result.current.isMyTurn).toBe(false);
  });

  it('has no name skeleton before the letter clue', async () => {
    const { result } = await setup();
    expect(result.current.skeletonGroups).toEqual([]);
    expect(result.current.skeletonLengthKnown).toBe(false);
  });

  it('shows the first letter alone at the first letter stage', async () => {
    const { result } = await setup({ gameState: gameState({ revealedClueIds: ['letter'] }) });
    expect(result.current.skeletonGroups.length).toBeGreaterThan(0);
    expect(result.current.skeletonLengthKnown).toBe(false);
  });

  it.each<[string, ClueId[]]>([
    ['the second letter stage', ['letter', 'letter']],
    ['the vowels clue', ['vowels']],
  ])('knows the name length at %s', async (_, revealedClueIds) => {
    const { result } = await setup({ gameState: gameState({ revealedClueIds }) });
    expect(result.current.skeletonLengthKnown).toBe(true);
  });
});

describe('useOnlineClueGame — the draft guess', () => {
  it('keeps what is typed', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Par'));
    expect(result.current.guessText).toBe('Par');
  });

  it('starts over when the turn passes to someone else', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Par'));
    await setGame({ turnUid: 'guest' });
    expect(result.current.guessText).toBe('');
  });
});

describe('useOnlineClueGame — sharing this device\'s draft guess', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('mirrors the turn-holder\'s text to the room, 500ms after it stops changing', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(499));
    expect(setClueRoomTyping).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(1));
    expect(setClueRoomTyping).toHaveBeenCalledWith('tabofuna', 'host', 'Pa');
  });

  it('debounces every further keystroke, one write per pause', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('P'));
    await act(async () => jest.advanceTimersByTime(200));
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(200));
    await act(async () => result.current.setGuessText('Par'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).toHaveBeenCalledTimes(1);
    expect(setClueRoomTyping).toHaveBeenCalledWith('tabofuna', 'host', 'Par');
  });

  it('does not write again when the debounced value has not actually changed', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).toHaveBeenCalledTimes(1);
    await setGame({ wrongGuessSeq: 1 });
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).toHaveBeenCalledTimes(1);
  });

  it('clears the room once the text is emptied back out (e.g. after a submit)', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(500));
    await act(async () => result.current.setGuessText(''));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).toHaveBeenLastCalledWith('tabofuna', 'host', '');
  });

  it('never writes for a spectator (not the turn-holder)', async () => {
    const { result } = await setup({ localUid: 'guest' });
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).not.toHaveBeenCalled();
  });

  it('never writes once the round is over', async () => {
    const { result } = await setup({ gameState: gameState({ verdict: 'giveUp' }) });
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).not.toHaveBeenCalled();
  });

  it('swallows a failed write', async () => {
    jest.mocked(setClueRoomTyping).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).toHaveBeenCalledTimes(1);
  });

  it('never writes alone in the room (nothing to show anyone)', async () => {
    const { result } = await setup({ players: { host: { name: 'Zoé', joinedAt: arrivedAt(1) } } });
    await act(async () => result.current.setGuessText('Pa'));
    await act(async () => jest.advanceTimersByTime(500));
    expect(setClueRoomTyping).not.toHaveBeenCalled();
  });
});

describe('useOnlineClueGame — watching the turn-holder type', () => {
  it("shows the turn-holder's live text to a spectator", async () => {
    const { result } = await setup({
      localUid: 'guest',
      gameState: gameState({ typing: { uid: 'host', text: 'Pari' } }),
    });
    expect(result.current.typedByActivePlayer).toBe('Pari');
  });

  it('shows nothing to the turn-holder themself', async () => {
    const { result } = await setup({ gameState: gameState({ typing: { uid: 'host', text: 'Pari' } }) });
    expect(result.current.typedByActivePlayer).toBe('');
  });

  it('ignores a value left over from a previous turn-holder', async () => {
    const { result } = await setup({
      localUid: 'guest',
      gameState: gameState({ turnUid: 'host', typing: { uid: 'guest', text: 'Rome' } }),
    });
    expect(result.current.typedByActivePlayer).toBe('');
  });

  it('shows nothing once the round is over', async () => {
    const { result } = await setup({
      localUid: 'guest',
      gameState: gameState({ verdict: 'correct', typing: { uid: 'host', text: 'Pari' } }),
    });
    expect(result.current.typedByActivePlayer).toBe('');
  });

  it('shows nothing before anything has been typed', async () => {
    const { result } = await setup({ localUid: 'guest' });
    expect(result.current.typedByActivePlayer).toBe('');
  });
});

describe('useOnlineClueGame — picking a clue', () => {
  it('reveals the clue and hands the turn to the next player', async () => {
    const { result } = await setup({ gameState: gameState({ revealedClueIds: ['emoji'] }) });
    await act(async () => result.current.pickClue('population'));
    expect(pickClueRoomClue).toHaveBeenCalledWith('tabofuna', ['emoji', 'population'], 'guest');
  });

  it('wraps around to the first player after the last one', async () => {
    const { result } = await setup({ localUid: 'guest', gameState: gameState({ turnUid: 'guest' }) });
    await act(async () => result.current.pickClue('population'));
    expect(pickClueRoomClue).toHaveBeenCalledWith('tabofuna', ['population'], 'host');
  });

  it('swallows a failed write', async () => {
    jest.mocked(pickClueRoomClue).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.pickClue('population'));
    expect(pickClueRoomClue).toHaveBeenCalledTimes(1);
  });

  it('is only for the turn-holder', async () => {
    const { result } = await setup({ localUid: 'guest' });
    await act(async () => result.current.pickClue('population'));
    expect(pickClueRoomClue).not.toHaveBeenCalled();
  });

  it('does nothing with nobody in the room to hand the turn to', async () => {
    const { result } = await setup({ players: {} });
    await act(async () => result.current.pickClue('population'));
    expect(pickClueRoomClue).not.toHaveBeenCalled();
  });
});

describe('useOnlineClueGame — guessing', () => {
  it('reports a right answer, however it is typed', async () => {
    const { result } = await setup();
    await act(async () => result.current.setGuessText('  PARIS '));
    await act(async () => result.current.submitGuess());
    expect(reportClueRoomCorrect).toHaveBeenCalledWith('tabofuna', 'host');
    expect(reportClueRoomWrong).not.toHaveBeenCalled();
  });

  it('swallows a failed report of a right answer', async () => {
    jest.mocked(reportClueRoomCorrect).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Paris'));
    await act(async () => result.current.submitGuess());
    expect(reportClueRoomCorrect).toHaveBeenCalledTimes(1);
  });

  it('reports a wrong answer and empties the field', async () => {
    const { result } = await setup({ gameState: gameState({ wrongGuessSeq: 2 }) });
    await act(async () => result.current.setGuessText('Rome'));
    await act(async () => result.current.submitGuess());
    expect(reportClueRoomWrong).toHaveBeenCalledWith('tabofuna', 'host', 3);
    expect(result.current.guessText).toBe('');
  });

  it('swallows a failed report of a wrong answer', async () => {
    jest.mocked(reportClueRoomWrong).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup();
    await act(async () => result.current.setGuessText('Rome'));
    await act(async () => result.current.submitGuess());
    expect(reportClueRoomWrong).toHaveBeenCalledTimes(1);
  });

  it('is only for the turn-holder, once the place is known', async () => {
    const guest = await setup({ localUid: 'guest' });
    await act(async () => guest.result.current.submitGuess());
    await guest.unmount();
    const noPlace = await setup({ gameState: gameState({ places: [] }) });
    await act(async () => noPlace.result.current.submitGuess());
    expect(reportClueRoomCorrect).not.toHaveBeenCalled();
    expect(reportClueRoomWrong).not.toHaveBeenCalled();
  });
});

describe('useOnlineClueGame — who missed, shown to everyone', () => {
  it('shows nobody until the room reflects a miss', async () => {
    const { result } = await setup();
    expect(result.current.wrongGuesserName).toBeNull();
  });

  it('names whoever missed, once the room reflects it', async () => {
    const { result } = await setup();
    await setGame({ wrongGuessUid: 'host', wrongGuessSeq: 1 });
    expect(result.current.wrongGuesserName).toBe('Zoé');
  });

  it('clears itself once that player’s turn ends (they pick a clue, passing the turn on)', async () => {
    const { result } = await setup();
    await setGame({ wrongGuessUid: 'host', wrongGuessSeq: 1 });
    expect(result.current.wrongGuesserName).toBe('Zoé');
    await setGame({ turnUid: 'guest', wrongGuessUid: 'host', wrongGuessSeq: 1 });
    expect(result.current.wrongGuesserName).toBeNull();
  });

  it('does not carry a miss over into a new round, even if the same player is first again', async () => {
    // wrongGuessSeq is never reset between rounds (the host's own scoring relies on that, see
    // useHostTurnScoring) — the baseline captured at this round's start is what tells the two apart.
    const { result } = await setup({ gameState: gameState({ wrongGuessUid: 'host', wrongGuessSeq: 3 }) });
    expect(result.current.wrongGuesserName).toBeNull();
    await setGame({ roundIndex: 1, wrongGuessUid: 'host', wrongGuessSeq: 3 });
    expect(result.current.wrongGuesserName).toBeNull();
    await setGame({ roundIndex: 1, wrongGuessUid: 'host', wrongGuessSeq: 4 });
    expect(result.current.wrongGuesserName).toBe('Zoé');
  });

  it('shows nobody if the wrong guesser is not (or no longer) in the players list', async () => {
    const { result } = await setup({ players: { guest: { name: 'Max', joinedAt: arrivedAt(2) } } });
    await setGame({ wrongGuessUid: 'host', wrongGuessSeq: 1 });
    expect(result.current.wrongGuesserName).toBeNull();
  });

  it('gives up for the host, whoever holds the turn (cutting the round short is a host call)', async () => {
    jest.mocked(giveUpClueRoom).mockRejectedValueOnce(new Error('offline'));
    const { result, unmount } = await setup();
    await act(async () => result.current.giveUp());
    expect(giveUpClueRoom).toHaveBeenCalledWith('tabofuna');

    await unmount();
    // Still the host, but not the turn-holder this time — the Firestore rules let the host write
    // any field regardless of `turnUid` (see `giveUp`'s own comment), so this must still work.
    const hostNotTurnHolder = await setup({ gameState: gameState({ turnUid: 'guest' }) });
    await act(async () => hostNotTurnHolder.result.current.giveUp());
    expect(giveUpClueRoom).toHaveBeenCalledTimes(2);
    await hostNotTurnHolder.unmount();

    // The turn-holder, but not the host: no longer enough on its own.
    const guestTurnHolder = await setup({ localUid: 'guest', gameState: gameState({ turnUid: 'guest' }) });
    await act(async () => guestTurnHolder.result.current.giveUp());
    expect(giveUpClueRoom).toHaveBeenCalledTimes(2);
  });
});

describe('useOnlineClueGame — next round', () => {
  it('lets the host start the next round with the first player, honoring the first-letter option', async () => {
    jest.mocked(nextClueRoomRound).mockRejectedValueOnce(new Error('offline'));
    const { result } = await setup({ roomSettings: { startWithFirstLetter: true } as never });
    await act(async () => result.current.goToNextRound());
    expect(nextClueRoomRound).toHaveBeenCalledWith('tabofuna', 1, 2, 'host', true);
  });

  it('starts without the first letter when there are no settings yet', async () => {
    const { result } = await setup({ roomSettings: null });
    await act(async () => result.current.goToNextRound());
    expect(nextClueRoomRound).toHaveBeenCalledWith('tabofuna', 1, 2, 'host', false);
  });

  it('is left to the host', async () => {
    const { result } = await setup({ localUid: 'guest' });
    await act(async () => result.current.goToNextRound());
    expect(nextClueRoomRound).not.toHaveBeenCalled();
  });

  it('does nothing with nobody in the room', async () => {
    const { result } = await setup({ players: {} });
    await act(async () => result.current.goToNextRound());
    expect(nextClueRoomRound).not.toHaveBeenCalled();
  });
});

describe('useOnlineClueGame — scoring (host only)', () => {
  it('writes the total once the turn-holder found the place', async () => {
    await setup({
      gameState: gameState({ verdict: 'correct', roundWinnerUid: 'guest', totalScores: { host: 5 } }),
    });
    expect(applyClueRoomScore).toHaveBeenCalledTimes(1);
    const [code, totals] = jest.mocked(applyClueRoomScore).mock.calls[0];
    expect(code).toBe('tabofuna');
    expect(totals.host).toBe(5);
    expect(totals.guest).toBeGreaterThan(0);
  });
});

describe('useOnlineClueGame — a turn-holder who left (host only)', () => {
  it('hands the turn to the first player still there', async () => {
    jest.mocked(passRoomTurn).mockRejectedValueOnce(new Error('offline'));
    await setup({ gameState: gameState({ turnUid: 'ghost' }) });
    expect(passRoomTurn).toHaveBeenCalledWith('tabofuna', 'host');
  });
});
