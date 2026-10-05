import { fireEvent, render } from '@testing-library/react-native';

import { buildHintPlan, hintGroupsView, type HintStep } from '@/games/contour/helpers/hintPlan';
import type { ContourRoomGameState } from '@/games/contour/helpers/room';
import { translations } from '@/i18n/translations';
import { FIXTURE_CONTOURS as CONTOURS, SAMPLE_CONTOUR_COUNTRY } from '@/helpers/storyFixtures';

import { OnlineContourGameScreen } from './OnlineContourGameScreen';

const t = translations.fr;

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: mockDismissTo }) }));

let mockGame: Record<string, unknown> = {};
jest.mock('./useOnlineContourGame', () => ({ useOnlineContourGame: () => mockGame }));

// France with its names, capital and cities, as a round's document gives them.
const FRANCE = SAMPLE_CONTOUR_COUNTRY;

// Every kind of hint: 12 steps for France (3 silhouette, 3 neighbors, 2 cities, 2 capital, the reveal).
const FULL_PLAN = buildHintPlan(['silhouette', 'neighbors', 'cities', 'capital'], FRANCE);

const ZOE = { uid: 'zoe', name: 'Zoé', color: '#EF4444' };
const MAX = { uid: 'max', name: 'Max', color: '#3B82F6' };

const gameState = (overrides: Partial<ContourRoomGameState> = {}): ContourRoomGameState => ({
  screen: 'game',
  countryCodes: ['FR', 'ES'],
  simplifySeed: 3,
  roundIndex: 0,
  hintsRevealed: 0,
  hintPicks: [],
  quadrantsRevealed: [],
  typing: null,
  turnUid: 'zoe',
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  wrongGuessHints: null,
  totalScores: { zoe: 375, max: 125 },
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
    roomSettings: { difficulty: 'easy' },
    gameState: gameState(),
    country: FRANCE,
    neighborCountries: CONTOURS,
    roundFailed: false,
    retryRound: jest.fn(),
    plan: FULL_PLAN,
    simplifySeed: 11,
    isMyTurn: true,
    guessedThisTurn: false,
    pointsAtStake: 500,
    guessText: '',
    setGuessText: jest.fn(),
    lastWrong: null,
    typedByActivePlayer: '',
    revealHint: jest.fn(),
    // Only the top-left cell is open at the start of a round.
    hiddenQuadrants: [1, 2, 3],
    canOpenQuadrant: true,
    // What one more hint (a cell opening) takes off a correct guess.
    quadrantCost: 61,
    revealQuadrant: jest.fn(),
    submitGuess: jest.fn(),
    giveUp: jest.fn(),
    goToNextRound: jest.fn(),
    handleQuit: jest.fn(),
    reactions: { reaction: null, send: jest.fn(), canReact: false },
    devFeedback: { question: null, choose: jest.fn(), dismiss: jest.fn() },
    ...overrides,
  };
  mockGame.hintGroups ??= hintGroupsView(
    mockGame.plan as HintStep[],
    (mockGame.gameState as ContourRoomGameState).hintsRevealed,
  );
  // The plan steps on the board: with no cell opened, as many as the hints out.
  mockGame.stepsRevealed ??= (mockGame.gameState as ContourRoomGameState).hintsRevealed;
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

  it('says the country could not be read when the round failed to load, and tries again on a tap', async () => {
    setGame({ country: undefined, roundFailed: true });
    const { getByText, queryByText } = await renderScreen();
    expect(queryByText(t.game.loading)).toBeNull();
    await fireEvent.press(getByText(t.contourGame.loadFailed));
    expect((mockGame.retryRound as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('keeps the round on screen if a reload failed while the country is known', async () => {
    setGame({ roundFailed: true });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.contourGame.loadFailed)).toBeNull();
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
    await fireEvent.press(getByText(t.endScreen.quit));
    expect((mockGame.handleQuit as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('copes with this device missing from the players list', async () => {
    setGame({ gameState: gameState({ screen: 'end', totalScores: { zoe: 900 } }), localUid: 'ghost' });
    const { getByText } = await renderScreen();
    expect(getByText(t.endScreen.title)).toBeTruthy();
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
  it('asks the question with the points at stake next to it, labels the answer field and passes the typing on', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();
    // The header: the question and, on the same line, what a right answer is worth (a nested text of its own).
    expect(getByText(new RegExp(t.contourGame.guessPrompt.replace('?', '\?')))).toBeTruthy();
    expect(getByText(t.contourGame.guessLabel)).toBeTruthy();
    expect(getByText(`500 ${t.common.pts}`)).toBeTruthy();
    await fireEvent.changeText(getByPlaceholderText('Nom du pays…'), 'France');
    expect(mockGame.setGuessText).toHaveBeenCalledWith('France');
  });

  it('reveals the hint picked in the list and validates an answer', async () => {
    setGame({ guessText: 'Fra' });
    const { getByRole, getByText } = await renderScreen();
    await fireEvent.press(getByRole('button', { name: 'Plus net' }));
    await fireEvent.press(getByText('Valider'));
    expect(mockGame.revealHint).toHaveBeenCalledWith('silhouette');
    expect((mockGame.submitGuess as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('after a guess in this turn: the field and Valider are gone, only the move left (a hint) is said', async () => {
    setGame({ guessText: 'Esp', guessedThisTurn: true });
    const { getByText, queryByRole, queryByDisplayValue, queryByText } = await renderScreen();
    expect(getByText(t.game.alreadyGuessed)).toBeTruthy();
    expect(queryByDisplayValue('Esp')).toBeNull();
    expect(queryByRole('button', { name: 'Valider' })).toBeNull();
    expect(queryByText(t.contourGame.guessLabel)).toBeNull();
    expect(mockGame.submitGuess).not.toHaveBeenCalled();
  });

  it('shows the previous miss', async () => {
    setGame({ lastWrong: 'Zoé' });
    const { getByText } = await renderScreen();
    expect(getByText(t.contourGame.wrongGuess('Zoé', '5'))).toBeTruthy();
  });

  it('lets the player give up once the name is out', async () => {
    setGame({ gameState: gameState({ hintsRevealed: FULL_PLAN.length }), pointsAtStake: 0 });
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText(t.contourGame.continueLabel));
    expect((mockGame.giveUp as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('counts 0 points for a device with no score yet, and names nobody when it is not listed', async () => {
    setGame({ gameState: gameState({ totalScores: {} }), onlinePlayers: [MAX] });
    const { getByText } = await renderScreen();
    expect(getByText(`500 ${t.common.pts}`)).toBeTruthy();
  });

  it('shows the draft above the field as boxed letters, like Indices', async () => {
    setGame({ guessText: 'Fra' });
    const { getByText } = await renderScreen();
    ['F', 'R', 'A'].forEach((letter) => expect(getByText(letter)).toBeTruthy());
  });
});

describe('OnlineContourGameScreen — the hidden cells of the board', () => {
  it('shows a lock on every hidden cell, with what opening one costs, and opens the one the turn-holder taps', async () => {
    const { getAllByText, getByRole } = await renderScreen();
    expect(getAllByText('🔒')).toHaveLength(3);
    expect(getAllByText(t.contourGame.quadrantCost('61'))).toHaveLength(3);
    await fireEvent.press(getByRole('button', { name: t.contourGame.quadrantLabel(3) }));
    expect(mockGame.revealQuadrant).toHaveBeenCalledWith(2);
  });

  it('leaves them as plain locks for a player who is only watching', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }) });
    const { getAllByText, queryByText, queryByRole } = await renderScreen();
    expect(getAllByText('🔒')).toHaveLength(3);
    expect(queryByText(t.contourGame.quadrantCost('61'))).toBeNull();
    expect(queryByRole('button', { name: t.contourGame.quadrantLabel(2) })).toBeNull();
  });

  it('leaves them as plain locks too once the country itself is out: opening one would gain nothing', async () => {
    setGame({ canOpenQuadrant: false });
    const { getAllByText, queryByText, queryByRole } = await renderScreen();
    expect(getAllByText('🔒')).toHaveLength(3);
    expect(queryByText(t.contourGame.quadrantCost('61'))).toBeNull();
    expect(queryByRole('button', { name: t.contourGame.quadrantLabel(2) })).toBeNull();
  });

  it('hides nothing once every cell is open, nor once the round is over', async () => {
    setGame({ hiddenQuadrants: [] });
    expect((await renderScreen()).queryByText('🔒')).toBeNull();
    setGame({ gameState: gameState({ verdict: 'giveUp' }) });
    expect((await renderScreen()).queryByText('🔒')).toBeNull();
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

  it('stays a bare silhouette while the outline gets precise (tiers 1 to 3)', async () => {
    for (const hintsRevealed of [1, 2, 3]) {
      setGame({ gameState: gameState({ hintsRevealed }) });
      expect(await paths()).toBe(2);
    }
  });

  it('draws the borders once and the neighbors as dashed lines only, from tier 4 on', async () => {
    setGame({ gameState: gameState({ hintsRevealed: 4 }) });
    expect(await paths()).toBe(4);
    // a step earlier (the full ring alone), no neighbor yet
    setGame({ gameState: gameState({ hintsRevealed: 3 }) });
    expect(await paths()).toBe(2);
  });

  it('draws the cities as dots, then their names, at their position', async () => {
    setGame({ gameState: gameState({ hintsRevealed: 9 }) });
    const dots = await renderScreen();
    expect(JSON.stringify(dots.toJSON())).toContain('●');
    expect(JSON.stringify(dots.toJSON())).not.toContain('Marseille');
    setGame({ gameState: gameState({ hintsRevealed: 10 }) });
    const names = await renderScreen();
    expect(JSON.stringify(names.toJSON())).toContain('Marseille');
  });

  it('follows the plan of the room: capital hints only means the full ring from the start, then the star', async () => {
    const plan = buildHintPlan(['capital'], FRANCE);
    setGame({ plan, gameState: gameState({ hintsRevealed: 0 }) });
    const start = await renderScreen();
    expect(JSON.stringify(start.toJSON())).not.toContain('⭐');
    setGame({ plan, gameState: gameState({ hintsRevealed: 1 }) });
    const star = await renderScreen();
    expect(JSON.stringify(star.toJSON())).toContain('⭐');
    setGame({ plan, gameState: gameState({ hintsRevealed: 2 }) });
    const named = await renderScreen();
    expect(JSON.stringify(named.toJSON())).toContain('Paris');
  });

  it('lets the player give up on the last step of a shorter plan', async () => {
    const plan = buildHintPlan(['capital'], FRANCE);
    setGame({ plan, gameState: gameState({ hintsRevealed: plan.length }), pointsAtStake: 0 });
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText(t.contourGame.continueLabel));
    expect((mockGame.giveUp as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('shows the full ring when the round is over, whatever the tier', async () => {
    setGame({ gameState: gameState({ hintsRevealed: 0, verdict: 'giveUp' }) });
    expect(await paths()).toBe(4);
  });
});

describe("OnlineContourGameScreen — somebody else's turn (watching)", () => {
  it('lets anybody type a country, keeps their own draft in the field and Valider greyed out', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }), guessText: 'Esp' });
    const { getByDisplayValue, getByRole, getByPlaceholderText } = await renderScreen();
    expect(getByDisplayValue('Esp').props.editable).not.toBe(false);
    await fireEvent.changeText(getByPlaceholderText('Nom du pays…'), 'Espagne');
    expect(mockGame.setGuessText).toHaveBeenCalledWith('Espagne');
    expect(getByRole('button', { name: 'Valider' }).props.accessibilityState.disabled).toBe(true);
  });

  it('shows what the turn-holder types, live, as boxed letters above the field', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }), typedByActivePlayer: 'Fran', guessText: '' });
    const { getByText } = await renderScreen();
    ['F', 'R', 'A', 'N'].forEach((letter) => expect(getByText(letter)).toBeTruthy());
  });

  it('says nobody found it, 0 point, once every hint is out and it is not their turn', async () => {
    setGame({
      isMyTurn: false,
      gameState: gameState({ hintsRevealed: FULL_PLAN.length, turnUid: 'max' }),
      pointsAtStake: 0,
    });
    const { getByText } = await renderScreen();
    expect(getByText(t.common.noOneFound)).toBeTruthy();
    expect(getByText(`0 ${t.common.pts}`)).toBeTruthy();
  });

  it('explains it is not their turn when they tap a hint, instead of revealing it', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }) });
    const { getByRole, getByText, queryByText } = await renderScreen();
    expect(queryByText(t.contourGame.notYourTurn('Max'))).toBeNull();
    await fireEvent.press(getByRole('button', { name: 'Plus net' }));
    expect(getByText(t.contourGame.notYourTurn('Max'))).toBeTruthy();
    expect(mockGame.revealHint).not.toHaveBeenCalled();
  });

  it('says so too when they press done on the keyboard with a country typed', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }), guessText: 'Espagne' });
    const { getByDisplayValue, getByText } = await renderScreen();
    await fireEvent(getByDisplayValue('Espagne'), 'submitEditing');
    expect(getByText(t.contourGame.notYourTurn('Max'))).toBeTruthy();
    expect((mockGame.submitGuess as jest.Mock).mock.calls).toHaveLength(0);
  });
});

describe("OnlineContourGameScreen — somebody else's turn", () => {
  it('has no active control and no banner naming the turn-holder', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'max' }) });
    const { getByRole, queryByText } = await renderScreen();
    expect(getByRole('button', { name: 'Valider' }).props.accessibilityState.disabled).toBe(true);
    expect(queryByText(/Au tour de/)).toBeNull();
  });

  it('names nobody in the notice when the turn-holder is not in the players list', async () => {
    setGame({ isMyTurn: false, gameState: gameState({ turnUid: 'ghost' }) });
    const { getByRole, getByText } = await renderScreen();
    await fireEvent.press(getByRole('button', { name: 'Plus net' }));
    expect(getByText(t.contourGame.notYourTurn(''))).toBeTruthy();
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

  it('gives a joiner nothing to press and no waiting message', async () => {
    over({ isHost: false });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.game.waitingForOthers)).toBeNull();
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

describe('OnlineContourGameScreen — emoji reactions', () => {
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

describe('OnlineContourGameScreen — dev mode difficulty question', () => {
  it('asks it over the screen, and reports the answer tapped or the dismissal', async () => {
    const choose = jest.fn();
    const dismiss = jest.fn();
    setGame({ devFeedback: { question: 'Le pays France était-il…', choose, dismiss } });
    const { getByText, getByLabelText } = await renderScreen();
    expect(getByText('Le pays France était-il…')).toBeTruthy();
    await fireEvent.press(getByText(/Difficile/));
    expect(choose).toHaveBeenCalledWith('hard');
    await fireEvent.press(getByLabelText('Fermer sans répondre'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('asks it over the final standings too (the last round is asked about there), and reports the answer', async () => {
    const choose = jest.fn();
    setGame({ gameState: gameState({ screen: 'end', totalScores: { zoe: 900 } }), devFeedback: { question: 'Le pays Rome était-il…', choose, dismiss: jest.fn() } });
    const { getByText } = await renderScreen();
    expect(getByText('Le pays Rome était-il…')).toBeTruthy();
    await fireEvent.press(getByText(/Facile/));
    expect(choose).toHaveBeenCalledWith('easy');
  });

  it('asks nothing when the game has no question', async () => {
    const { queryByText } = await renderScreen();
    expect(queryByText(/était-il/)).toBeNull();
  });
});
