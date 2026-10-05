import { act, fireEvent, render } from '@testing-library/react-native';

import { FIXTURE_CLUE_PLACES as CLUE_PLACES } from '@/helpers/storyFixtures';
import { CLUE_ORDER } from '@/games/clues/constants';
import type { ClueRoomGameState } from '@/games/clues/helpers/room';
import { translations } from '@/i18n/translations';

import { OnlineClueGameScreen } from './OnlineClueGameScreen';

const t = translations.fr;

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: mockDismissTo }) }));

let mockGame: Record<string, unknown> = {};
jest.mock('./useOnlineClueGame', () => ({ useOnlineClueGame: () => mockGame }));

const PLACE = CLUE_PLACES.find((place) => place.country === 'France')!;
const ORIGIN = { name: 'Ici', coordinates: { latitude: 40, longitude: -3 }, isDevicePosition: false };

const ZOE = { uid: 'zoe', name: 'Zoé', color: '#EF4444' };
const MAX = { uid: 'max', name: 'Max', color: '#3B82F6' };

const gameState = (overrides: Partial<ClueRoomGameState> = {}): ClueRoomGameState => ({
  screen: 'game',
  origin: ORIGIN,
  places: [PLACE, PLACE],
  roundIndex: 0,
  revealedClueIds: [],
  turnUid: 'zoe',
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  wrongGuessHints: null,
  totalScores: { zoe: 12, max: 5 },
  typing: null,
  ...overrides,
});

const setGame = (overrides: Record<string, unknown> = {}) => {
  mockGame = {
    localUid: 'zoe',
    onlinePlayers: [ZOE, MAX],
    // The round's playing order, rotated by the round number in the hook (`playersForRound`).
    roundPlayers: [ZOE, MAX],
    isHost: true,
    connectionLost: false,
    connected: true,
    roomSettings: { difficulty: 'easy', startWithFirstLetter: false },
    gameState: gameState(),
    place: PLACE,
    bearing: 90,
    distance: 1000,
    isMyTurn: true,
    guessedThisTurn: false,
    typedByActivePlayer: '',
    skeletonGroups: [],
    skeletonLengthKnown: false,
    remaining: 24,
    guessText: '',
    setGuessText: jest.fn(),
    wrongGuesserName: null,
    pickClue: jest.fn(),
    submitGuess: jest.fn(),
    giveUp: jest.fn(),
    goToNextRound: jest.fn(),
    handleQuit: jest.fn(),
    reactions: { reaction: null, send: jest.fn(), canReact: false },
    devFeedback: { question: null, choose: jest.fn(), dismiss: jest.fn() },
    ...overrides,
  };
};

const renderScreen = () => render(<OnlineClueGameScreen code="tabofuna" onQuit={jest.fn()} />);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  setGame();
});
afterEach(() => jest.useRealTimers());

describe('OnlineClueGameScreen — before the round', () => {
  it('renders nothing once the store is disconnected (the host just quit)', async () => {
    setGame({ connected: false });
    const { toJSON } = await renderScreen();
    expect(toJSON()).toBeNull();
  });

  it('tells a device that lost its connection, and goes home on a tap', async () => {
    setGame({ connectionLost: true });
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText(t.setup.online.connectionLostNotice));
    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });

  it.each([
    ['no local uid yet', { localUid: null }],
    ['no room settings yet', { roomSettings: null }],
    ['no place yet', { place: undefined }],
    ['no origin yet', { gameState: gameState({ origin: null }) }],
  ])('shows the loading splash with %s', async (_, overrides) => {
    setGame(overrides);
    const { getByText } = await renderScreen();
    expect(getByText(t.game.loading)).toBeTruthy();
  });
});

describe('OnlineClueGameScreen — the end', () => {
  it('lists the final scores and goes home', async () => {
    setGame({ gameState: gameState({ screen: 'end', totalScores: { zoe: 30 } }) });
    const { getByText } = await renderScreen();
    expect(getByText(t.endScreen.title)).toBeTruthy();
    await fireEvent.press(getByText(t.endScreen.quit));
    expect((mockGame.handleQuit as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('copes with this device missing from the players list', async () => {
    setGame({ gameState: gameState({ screen: 'end', totalScores: { zoe: 30 } }), localUid: 'ghost' });
    const { getByText } = await renderScreen();
    expect(getByText(t.endScreen.title)).toBeTruthy();
  });
});

describe('OnlineClueGameScreen — after the last round', () => {
  it('shows the final scores, not the loading splash, although no round is left to load', async () => {
    setGame({ gameState: gameState({ screen: 'end', roundIndex: 2 }), place: undefined });
    const { getByText, queryByText } = await renderScreen();
    expect(queryByText(t.game.loading)).toBeNull();
    expect(getByText(t.endScreen.title)).toBeTruthy();
  });
});

describe('OnlineClueGameScreen — the turn-holder', () => {
  it('shows the points at stake and lets the host give up while the field is empty', async () => {
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.pointsAtStake('24'))).toBeTruthy();
    await fireEvent.press(getByText(t.cluesGame.giveUp));
    expect((mockGame.giveUp as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('gives a non-host turn-holder nothing to press while the field is empty — only the host gives up', async () => {
    setGame({ isMyTurn: true, isHost: false });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.cluesGame.giveUp)).toBeNull();
  });

  it('submits once something is typed, from the button or the keyboard', async () => {
    setGame({ guessText: 'Par' });
    const { getByText, getByDisplayValue } = await renderScreen();
    await fireEvent.press(getByText(t.cluesGame.submitGuess));
    await fireEvent(getByDisplayValue('Par'), 'submitEditing');
    expect((mockGame.submitGuess as jest.Mock).mock.calls).toHaveLength(2);
  });

  it('after a guess in this turn: the field and Valider are gone, only the move left (a clue) is said', async () => {
    setGame({ guessText: 'Rome', guessedThisTurn: true });
    const { getByText, queryByRole, queryByPlaceholderText } = await renderScreen();
    expect(getByText(t.game.alreadyGuessed)).toBeTruthy();
    expect(queryByPlaceholderText(t.cluesGame.guessPlaceholder)).toBeNull();
    expect(queryByRole('button', { name: t.cluesGame.submitGuess })).toBeNull();
  });

  it('after a guess, the host can still give up', async () => {
    setGame({ guessedThisTurn: true, isHost: true });
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText(t.cluesGame.giveUp));
    expect(mockGame.giveUp).toHaveBeenCalledTimes(1);
  });

  it('says nothing about it before the guess', async () => {
    setGame({ guessText: 'Par' });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.game.alreadyGuessed)).toBeNull();
  });

  it('forwards typing', async () => {
    const { getByPlaceholderText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText(t.cluesGame.guessPlaceholder), 'Paris');
    expect(mockGame.setGuessText).toHaveBeenCalledWith('Paris');
  });

  it('counts 0 points for a device with no score yet', async () => {
    setGame({ gameState: gameState({ totalScores: {} }) });
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.pointsAtStake('24'))).toBeTruthy();
  });

  it('shows the previous miss', async () => {
    setGame({ wrongGuesserName: 'Zoé' });
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.missed('Zoé', '10'))).toBeTruthy();
  });

  it('picks a clue', async () => {
    const { getAllByText } = await renderScreen();
    await fireEvent.press(getAllByText('🔒')[0]);
    expect(mockGame.pickClue).toHaveBeenCalledWith(CLUE_ORDER[0]);
  });

  describe('with the name skeleton', () => {
    it('shows the clue’s first letter before anything is typed, and does not cap the text while the length is unknown', async () => {
      setGame({ skeletonGroups: [['P', null, null]], skeletonLengthKnown: false });
      const { getByText, getByPlaceholderText } = await renderScreen();
      expect(getByText('P')).toBeTruthy();
      await fireEvent.changeText(getByPlaceholderText(t.cluesGame.guessPlaceholder), 'Parisiens');
      expect(mockGame.setGuessText).toHaveBeenCalledWith('Parisiens');
    });

    it('boxes the whole typed word, live and uppercased, past the clue’s single lone slot', async () => {
      setGame({ skeletonGroups: [['D', null, null]], skeletonLengthKnown: false, guessText: 'dijon' });
      const { getAllByText } = await renderScreen();
      for (const letter of ['D', 'I', 'J', 'O', 'N']) expect(getAllByText(letter).length).toBeGreaterThan(0);
    });

    it('shows a hyphen of the name in place, outside of any letter slot', async () => {
      setGame({ skeletonGroups: [['A', '-', null]], skeletonLengthKnown: true });
      const { getByText } = await renderScreen();
      expect(getByText('-')).toBeTruthy();
    });

    it('overlays the typed letters and refuses more letters than there are slots once the length is known', async () => {
      setGame({ skeletonGroups: [['P', null, null]], skeletonLengthKnown: true, guessText: 'Pa' });
      const { getByText, getByPlaceholderText } = await renderScreen();
      expect(getByText('A')).toBeTruthy();
      await fireEvent.changeText(getByPlaceholderText(t.cluesGame.guessPlaceholder), 'Pari');
      expect(mockGame.setGuessText).not.toHaveBeenCalled();
      await fireEvent.changeText(getByPlaceholderText(t.cluesGame.guessPlaceholder), 'Par');
      expect(mockGame.setGuessText).toHaveBeenCalledWith('Par');
    });
  });
});

describe("OnlineClueGameScreen — somebody else's turn", () => {
  beforeEach(() => setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }) }));

  it('shows only the points at stake in the footer, no submit button', async () => {
    const { getByText, queryByText } = await renderScreen();
    expect(getByText(t.cluesGame.pointsAtStake('24'))).toBeTruthy();
    expect(queryByText(t.cluesGame.submitGuess)).toBeNull();
  });

  it('still lets the host give up from here, cutting the round short off their own turn', async () => {
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.giveUp)).toBeTruthy();
  });

  it('gives a non-host spectator no way to give up', async () => {
    setGame({ isMyTurn: false, isHost: false, gameState: gameState({ turnUid: 'max' }) });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.cluesGame.giveUp)).toBeNull();
  });

  it('shows what the turn-holder is typing, live, boxed and uppercased, even with no letter clue out yet', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }), typedByActivePlayer: 'pari' });
    const { getByText } = await renderScreen();
    for (const letter of ['P', 'A', 'R', 'I']) expect(getByText(letter)).toBeTruthy();
  });

  it('overlays it onto the letter clue skeleton once one is out, same as the turn-holder sees for themselves', async () => {
    setGame({
      isMyTurn: false,
      gameState: gameState({ turnUid: 'max' }),
      typedByActivePlayer: 'Pa',
      skeletonGroups: [['P', null, null]],
      skeletonLengthKnown: true,
    });
    const { getByText } = await renderScreen();
    expect(getByText('A')).toBeTruthy();
  });

  it('shows nothing while nothing has been typed yet', async () => {
    const { queryByText } = await renderScreen();
    expect(queryByText('Pari')).toBeNull();
  });

  it('answers a tap on a clue with a short notice, that closes by itself', async () => {
    const { getAllByText, queryByText } = await renderScreen();
    await fireEvent.press(getAllByText('🔒')[0]);
    expect(queryByText(t.cluesGame.notYourTurn('Max'))).toBeTruthy();
    // Still there after the usual 2 s: it stays up for 4.
    await act(async () => jest.advanceTimersByTime(3900));
    expect(queryByText(t.cluesGame.notYourTurn('Max'))).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(200));
    expect(queryByText(t.cluesGame.notYourTurn('Max'))).toBeNull();
    expect((mockGame.pickClue as jest.Mock).mock.calls).toHaveLength(0);
  });

  it('closes the notice on a tap too', async () => {
    const { getAllByText, getByText, queryByText } = await renderScreen();
    await fireEvent.press(getAllByText('🔒')[0]);
    await fireEvent.press(getByText(t.cluesGame.notYourTurn('Max')));
    expect(queryByText(t.cluesGame.notYourTurn('Max'))).toBeNull();
  });

  it('names nobody when the turn-holder is not in the players list', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'ghost' }) });
    const { getAllByText, queryByText } = await renderScreen();
    await fireEvent.press(getAllByText('🔒')[0]);
    expect(queryByText(t.cluesGame.notYourTurn(''))).toBeTruthy();
  });
});

describe('OnlineClueGameScreen — the round is over', () => {
  const over = (overrides: Record<string, unknown> = {}, state: Partial<ClueRoomGameState> = {}) =>
    setGame({ gameState: gameState({ verdict: 'correct', roundWinnerUid: 'max', ...state }), ...overrides });

  it('announces the winner and the answer, and lets the host go on', async () => {
    over();
    const { getByText, queryByText } = await renderScreen();
    expect(getByText(t.cluesGame.scored('Max', '24'))).toBeTruthy();
    expect(queryByText(t.cluesGame.pointsAtStake('24'))).toBeNull();
    await fireEvent.press(getByText(t.cluesGame.continueLabel));
    expect((mockGame.goToNextRound as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('offers the score after the last round', async () => {
    over({}, { roundIndex: 1 });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.last)).toBeTruthy();
  });

  it('gives a joiner nothing to press, and no "waiting" line either', async () => {
    over({ isHost: false });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.game.waitingForOthers)).toBeNull();
    expect(queryByText(t.cluesGame.continueLabel)).toBeNull();
  });

  it('tells the player who found it "you", not their own name', async () => {
    over({}, { roundWinnerUid: 'zoe' });
    const { getByText, queryByText } = await renderScreen();
    expect(getByText(t.cluesGame.youScored('24'))).toBeTruthy();
    expect(queryByText(t.cluesGame.scored('Zoé', '24'))).toBeNull();
  });

  it('says nobody found it after a give-up', async () => {
    over({}, { verdict: 'giveUp', roundWinnerUid: null });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.cluesGame.scored('Max', '24'))).toBeNull();
    expect(queryByText(t.cluesGame.wasPlace, { exact: false })).toBeTruthy();
  });

  it('names nobody when a correct verdict carries no winner', async () => {
    over({}, { roundWinnerUid: null });
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.scored('', '24'))).toBeTruthy();
  });

  it('names nobody when the winner is not in the players list', async () => {
    over({}, { roundWinnerUid: 'ghost' });
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.scored('', '24'))).toBeTruthy();
  });

  it('shows a name-less header for a device that is not listed', async () => {
    over({ onlinePlayers: [MAX] });
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.scored('Max', '24'))).toBeTruthy();
  });
});

describe('OnlineClueGameScreen — emoji reactions', () => {
  it('offers the emojis in the footer when other players are there, and sends the one tapped', async () => {
    const send = jest.fn();
    setGame({ reactions: { reaction: null, send, canReact: true } });
    const { getByLabelText } = await renderScreen();
    await fireEvent.press(getByLabelText('Réactions'));
    await fireEvent.press(getByLabelText('Envoyer 🤞'));
    expect(send).toHaveBeenCalledWith('🤞');
  });

  it('has no emojis alone in the room', async () => {
    setGame({ reactions: { reaction: null, send: jest.fn(), canReact: false } });
    const { queryByLabelText } = await renderScreen();
    expect(queryByLabelText('Réactions')).toBeNull();
  });

  it('shows a received reaction over the screen, with the name of whoever sent it', async () => {
    setGame({ reactions: { reaction: { emoji: '👏', name: 'Lou', seq: 1 }, send: jest.fn(), canReact: false } });
    const { getByText } = await renderScreen();
    expect(getByText('👏')).toBeTruthy();
    expect(getByText('Lou')).toBeTruthy();
  });
});

describe('OnlineClueGameScreen — dev mode difficulty question', () => {
  it('asks it over the screen, and reports the answer tapped or the dismissal', async () => {
    const choose = jest.fn();
    const dismiss = jest.fn();
    setGame({ devFeedback: { question: 'Le lieu Paris était-il…', choose, dismiss } });
    const { getByText, getByLabelText } = await renderScreen();
    expect(getByText('Le lieu Paris était-il…')).toBeTruthy();
    await fireEvent.press(getByText(/Difficile/));
    expect(choose).toHaveBeenCalledWith('hard');
    await fireEvent.press(getByLabelText('Fermer sans répondre'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('asks it over the final standings too (the last round is asked about there), and reports the answer', async () => {
    const choose = jest.fn();
    setGame({ gameState: gameState({ screen: 'end', totalScores: { zoe: 30 } }), devFeedback: { question: 'Le lieu Rome était-il…', choose, dismiss: jest.fn() } });
    const { getByText } = await renderScreen();
    expect(getByText('Le lieu Rome était-il…')).toBeTruthy();
    await fireEvent.press(getByText(/Facile/));
    expect(choose).toHaveBeenCalledWith('easy');
  });

  it('asks nothing when the game has no question', async () => {
    const { queryByText } = await renderScreen();
    expect(queryByText(/était-il/)).toBeNull();
  });
});
