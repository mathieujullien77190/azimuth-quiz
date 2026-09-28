import { act, fireEvent, render } from '@testing-library/react-native';

import { CLUE_PLACES } from '@/data';
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
  totalScores: { zoe: 12, max: 5 },
  ...overrides,
});

const setGame = (overrides: Record<string, unknown> = {}) => {
  mockGame = {
    localUid: 'zoe',
    onlinePlayers: [ZOE, MAX],
    isHost: true,
    connectionLost: false,
    connected: true,
    roomSettings: { difficulty: 'easy', startWithFirstLetter: false },
    gameState: gameState(),
    place: PLACE,
    bearing: 90,
    distance: 1000,
    isMyTurn: true,
    skeletonGroups: [],
    skeletonLengthKnown: false,
    remaining: 24,
    guessText: '',
    setGuessText: jest.fn(),
    lastWrong: null,
    pickClue: jest.fn(),
    submitGuess: jest.fn(),
    giveUp: jest.fn(),
    goToNextRound: jest.fn(),
    handleQuit: jest.fn(),
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
    await fireEvent.press(getByText(t.endScreen.menu));
    expect((mockGame.handleQuit as jest.Mock).mock.calls).toHaveLength(1);
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
  it('shows the points at stake and lets the player give up while the field is empty', async () => {
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.pointsAtStake('24'))).toBeTruthy();
    await fireEvent.press(getByText(t.cluesGame.giveUp));
    expect((mockGame.giveUp as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('submits once something is typed, from the button or the keyboard', async () => {
    setGame({ guessText: 'Par' });
    const { getByText, getByDisplayValue } = await renderScreen();
    await fireEvent.press(getByText(t.cluesGame.submitGuess));
    await fireEvent(getByDisplayValue('Par'), 'submitEditing');
    expect((mockGame.submitGuess as jest.Mock).mock.calls).toHaveLength(2);
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
    setGame({ lastWrong: 'Zoé' });
    const { getByText } = await renderScreen();
    expect(getByText(t.cluesGame.missed('Zoé', '10'))).toBeTruthy();
  });

  it('picks a clue', async () => {
    const { getAllByText } = await renderScreen();
    await fireEvent.press(getAllByText('🔒')[0]);
    expect(mockGame.pickClue).toHaveBeenCalledWith(CLUE_ORDER[0]);
  });

  describe('with the name skeleton', () => {
    it('shows the empty slots, and does not cap the text while the length is unknown', async () => {
      setGame({ skeletonGroups: [['P', null, null]], skeletonLengthKnown: false });
      const { getByText, getByPlaceholderText } = await renderScreen();
      expect(getByText('P')).toBeTruthy();
      await fireEvent.changeText(getByPlaceholderText(t.cluesGame.guessPlaceholder), 'Parisiens');
      expect(mockGame.setGuessText).toHaveBeenCalledWith('Parisiens');
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

  it('shows only the points at stake in the footer', async () => {
    const { getByText, queryByText } = await renderScreen();
    expect(getByText(t.cluesGame.pointsAtStake('24'))).toBeTruthy();
    expect(queryByText(t.cluesGame.giveUp)).toBeNull();
    expect(queryByText(t.cluesGame.submitGuess)).toBeNull();
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
