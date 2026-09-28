import { fireEvent, render } from '@testing-library/react-native';

import { CONTOURS } from '@/data';
import type { ContourRoomGameState } from '@/games/contour/helpers/room';
import { translations } from '@/i18n/translations';

import { OnlineContourGameScreen } from './OnlineContourGameScreen';

const t = translations.fr;

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: mockDismissTo }) }));

let mockGame: Record<string, unknown> = {};
jest.mock('./useOnlineContourGame', () => ({ useOnlineContourGame: () => mockGame }));

const FRANCE = CONTOURS.find((country) => country.code === 'FR')!;

const ZOE = { uid: 'zoe', name: 'Zoé', color: '#EF4444' };
const MAX = { uid: 'max', name: 'Max', color: '#3B82F6' };

const gameState = (overrides: Partial<ContourRoomGameState> = {}): ContourRoomGameState => ({
  screen: 'game',
  countryCodes: ['FR', 'ES'],
  simplifySeed: 3,
  roundIndex: 0,
  hintsRevealed: 0,
  turnUid: 'zoe',
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  totalScores: { zoe: 375, max: 125 },
  ...overrides,
});

const setGame = (overrides: Record<string, unknown> = {}) => {
  mockGame = {
    localUid: 'zoe',
    onlinePlayers: [ZOE, MAX],
    isHost: true,
    connectionLost: false,
    connected: true,
    roomSettings: { difficulty: 'easy' },
    gameState: gameState(),
    country: FRANCE,
    simplifySeed: 11,
    isMyTurn: true,
    pointsAtStake: 500,
    guessText: '',
    setGuessText: jest.fn(),
    lastWrong: null,
    revealHint: jest.fn(),
    submitGuess: jest.fn(),
    giveUp: jest.fn(),
    goToNextRound: jest.fn(),
    handleQuit: jest.fn(),
    ...overrides,
  };
};

const renderScreen = () => render(<OnlineContourGameScreen code="tabofuna" onQuit={jest.fn()} />);

beforeEach(() => {
  jest.clearAllMocks();
  setGame();
});

describe('OnlineContourGameScreen — before the round', () => {
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
    ['no country yet', { country: undefined }],
  ])('shows the loading splash with %s', async (_, overrides) => {
    setGame(overrides);
    const { getByText } = await renderScreen();
    expect(getByText(t.game.loading)).toBeTruthy();
  });
});

describe('OnlineContourGameScreen — the end', () => {
  it('lists the final scores and goes home', async () => {
    setGame({ gameState: gameState({ screen: 'end', totalScores: { zoe: 900 } }) });
    const { getByText } = await renderScreen();
    expect(getByText(t.endScreen.title)).toBeTruthy();
    await fireEvent.press(getByText(t.endScreen.menu));
    expect((mockGame.handleQuit as jest.Mock).mock.calls).toHaveLength(1);
  });
});

describe('OnlineContourGameScreen — after the last round', () => {
  it('shows the final scores, not the loading splash, although no round is left to load', async () => {
    setGame({ gameState: gameState({ screen: 'end', roundIndex: 2 }), country: undefined });
    const { getByText, queryByText } = await renderScreen();
    expect(queryByText(t.game.loading)).toBeNull();
    expect(getByText(t.endScreen.title)).toBeTruthy();
  });
});

describe('OnlineContourGameScreen — the turn-holder', () => {
  it('asks the question, shows the points at stake and passes the typing on', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();
    expect(getByText(t.contourGame.guessPrompt)).toBeTruthy();
    expect(getByText(t.contourGame.pointsAtStake('500'))).toBeTruthy();
    await fireEvent.changeText(getByPlaceholderText('Nom du pays…'), 'France');
    expect(mockGame.setGuessText).toHaveBeenCalledWith('France');
  });

  it('reveals a hint and validates an answer', async () => {
    setGame({ guessText: 'Fra' });
    const { getByLabelText, getByText } = await renderScreen();
    await fireEvent.press(getByLabelText(/Indice/));
    await fireEvent.press(getByText('Valider'));
    expect((mockGame.revealHint as jest.Mock).mock.calls).toHaveLength(1);
    expect((mockGame.submitGuess as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('shows the previous miss', async () => {
    setGame({ lastWrong: 'Zoé' });
    const { getByText } = await renderScreen();
    expect(getByText(t.contourGame.wrongGuess('Zoé'))).toBeTruthy();
  });

  it('lets the player give up once the name is out', async () => {
    setGame({ gameState: gameState({ hintsRevealed: 7 }), pointsAtStake: 0 });
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText(t.contourGame.continueLabel));
    expect((mockGame.giveUp as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('counts 0 points for a device with no score yet, and names nobody when it is not listed', async () => {
    setGame({ gameState: gameState({ totalScores: {} }), onlinePlayers: [MAX] });
    const { getByText } = await renderScreen();
    expect(getByText(t.contourGame.pointsAtStake('500'))).toBeTruthy();
  });
});

describe('OnlineContourGameScreen — the outline gets precise with the hints', () => {
  const paths = async () => {
    const { toJSON } = await renderScreen();
    return (JSON.stringify(toJSON()).match(/RNSVGPath/g) ?? []).length;
  };

  it('starts as a bare silhouette: one fill, one stroke, no neighbor', async () => {
    setGame({ gameState: gameState({ hintsRevealed: 0 }) });
    expect(await paths()).toBe(2);
  });

  it('stays a bare silhouette until the outline is the full ring (tiers 1 and 2)', async () => {
    for (const hintsRevealed of [1, 2]) {
      setGame({ gameState: gameState({ hintsRevealed }) });
      expect(await paths()).toBe(2);
    }
  });

  it('draws the neighbors around it, and the borders once, from the full ring on (tier 3)', async () => {
    setGame({ gameState: gameState({ hintsRevealed: 3 }) });
    expect(await paths()).toBeGreaterThan(3);
  });

  it('shows the full ring when the round is over, whatever the tier', async () => {
    setGame({ gameState: gameState({ hintsRevealed: 0, verdict: 'giveUp' }) });
    expect(await paths()).toBeGreaterThan(3);
  });
});

describe("OnlineContourGameScreen — somebody else's turn", () => {
  it('says whose turn it is, without any control', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }) });
    const { getByText, queryByText } = await renderScreen();
    expect(getByText(t.contourGame.waitingForTurn('Max'))).toBeTruthy();
    expect(queryByText('Valider')).toBeNull();
  });

  it('names nobody when the turn-holder is not in the players list', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'ghost' }) });
    const { getByText } = await renderScreen();
    expect(getByText(t.contourGame.waitingForTurn(''))).toBeTruthy();
  });
});

describe('OnlineContourGameScreen — the round is over', () => {
  const over = (overrides: Record<string, unknown> = {}, state: Partial<ContourRoomGameState> = {}) =>
    setGame({ gameState: gameState({ verdict: 'correct', roundWinnerUid: 'max', ...state }), ...overrides });

  it('announces the winner and lets the host go on', async () => {
    over();
    const { getByText, queryByText } = await renderScreen();
    expect(getByText(t.contourGame.found('Max', '500'))).toBeTruthy();
    expect(queryByText(t.contourGame.guessPrompt)).toBeNull();
    await fireEvent.press(getByText(t.contourGame.continueLabel));
    expect((mockGame.goToNextRound as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('offers the score after the last round', async () => {
    over({}, { roundIndex: 1 });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.last)).toBeTruthy();
  });

  it('gives a joiner nothing to press: it waits for the host', async () => {
    over({ isHost: false });
    const { getByText, queryByText } = await renderScreen();
    expect(getByText(t.game.waitingForOthers)).toBeTruthy();
    expect(queryByText(t.contourGame.continueLabel)).toBeNull();
  });

  it('says nobody found it after a give-up', async () => {
    over({}, { verdict: 'giveUp', roundWinnerUid: null });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.contourGame.found('Max', '500'))).toBeNull();
    expect(queryByText(t.contourGame.continueLabel)).toBeTruthy();
  });

  it('names nobody when a correct verdict carries no winner', async () => {
    over({}, { roundWinnerUid: null });
    const { getByText } = await renderScreen();
    expect(getByText(t.contourGame.found('', '500'))).toBeTruthy();
  });
});
