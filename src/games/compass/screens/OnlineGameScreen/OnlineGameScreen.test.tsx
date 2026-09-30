import { fireEvent, render } from '@testing-library/react-native';

import type { RoomGameState } from '@/games/compass/helpers/room';
import { translations } from '@/i18n/translations';
import type { RoundRecord, RoundScore } from '@/types';

import { OnlineGameScreen } from './OnlineGameScreen';

const t = translations.fr;

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ dismissTo: mockDismissTo }) }));

let mockGame: Record<string, unknown> = {};
jest.mock('./useOnlineGame', () => ({ useOnlineGame: () => mockGame }));

const BERLIN = {
  name: 'Berlin',
  code: 'DE',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  category: 'cities',
  difficulty: 'easy',
};
const ORIGIN = { name: 'Paris', coordinates: { latitude: 48.8566, longitude: 2.3522 }, isDevicePosition: false };

const ZOE = { uid: 'zoe', name: 'Zoé', color: '#EF4444' };
const MAX = { uid: 'max', name: 'Max', color: '#3B82F6' };
const EVE = { uid: 'eve', name: 'Eve', color: '#16A34A' };

const score: RoundScore = {
  trueBearing: 60,
  trueSurfaceDistanceKm: 880,
  directionError: 10,
  distanceError: 0.1,
  directionPoints: 400,
  distancePoints: 350,
  directionBonus: 100,
  distanceBonus: 0,
  directionExactBonus: 0,
  distanceExactBonus: 0,
  total: 850,
};
const record: RoundRecord = {
  place: BERLIN as never,
  results: [
    { guess: { bearing: 50, distanceKm: 900 }, score },
    { guess: { bearing: 70, distanceKm: 800 }, score: { ...score, total: 300 } },
  ],
};

const gameState = (overrides: Partial<RoomGameState> = {}): RoomGameState => ({
  screen: 'game',
  origin: ORIGIN,
  places: [BERLIN as never, BERLIN as never],
  roundIndex: 0,
  guesses: {},
  scores: null,
  totalScores: {},
  ...overrides,
});

const setGame = (overrides: Record<string, unknown> = {}) => {
  mockGame = {
    localUid: 'zoe',
    players: { zoe: { name: 'Zoé', color: '#EF4444' } },
    onlinePlayers: [ZOE, MAX],
    isHost: true,
    connectionLost: false,
    connected: true,
    roomSettings: { difficulty: 'easy', liveCompass: false, showCountry: false },
    gameState: gameState(),
    place: BERLIN,
    bearing: 0,
    distanceKm: 1000,
    bearingTouched: true,
    distanceTouched: true,
    setBearing: jest.fn(),
    setDistanceKm: jest.fn(),
    records: [],
    totals: [850, 300],
    myIndex: 0,
    handleQuit: jest.fn(),
    submit: jest.fn(),
    kickPlayer: jest.fn(),
    goToNextRound: jest.fn(),
    ...overrides,
  };
};

const renderScreen = (onQuit = jest.fn()) => render(<OnlineGameScreen code="tabofuna" onQuit={onQuit} />);

beforeEach(() => {
  jest.clearAllMocks();
  setGame();
});

describe('OnlineGameScreen — before the round', () => {
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

  it("shows the loading splash on the reveal until the round's scores arrive", async () => {
    setGame({ gameState: gameState({ screen: 'reveal', scores: null }) });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.loading)).toBeTruthy();
  });
});

describe('OnlineGameScreen — the end', () => {
  it('shows the final standings, and leaves through the home button', async () => {
    const handleQuit = jest.fn();
    setGame({ gameState: gameState({ screen: 'end' }), records: [record], handleQuit });
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText(t.endScreen.menu));
    // The session's own quit (home, and the host takes the room down), not a bare `router.back()`.
    expect(handleQuit).toHaveBeenCalledTimes(1);
  });

  it('copes with this device missing from the (frozen) players list', async () => {
    setGame({ gameState: gameState({ screen: 'end' }), records: [record], localUid: 'ghost' });
    const { getByText } = await renderScreen();
    expect(getByText(t.endScreen.title)).toBeTruthy();
  });
});

describe('OnlineGameScreen — after the last round', () => {
  it('shows the final standings, not the loading splash, although no round is left to load', async () => {
    // `roundIndex` points past the rounds, so `place` is undefined: that is the end, not a wait.
    setGame({ gameState: gameState({ screen: 'end', roundIndex: 2 }), place: undefined, records: [record] });
    const { getByText, queryByText } = await renderScreen();
    expect(queryByText(t.game.loading)).toBeNull();
    expect(getByText(t.endScreen.menu)).toBeTruthy();
  });
});

describe('OnlineGameScreen — answering', () => {
  it("offers the round's place and validates this device's answer", async () => {
    const { getByText } = await renderScreen();
    expect(getByText('Berlin')).toBeTruthy();
    await fireEvent.press(getByText(t.game.validate));
    expect((mockGame.submit as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('keeps "Valider" disabled until both the heading and the distance were touched', async () => {
    setGame({ bearingTouched: true, distanceTouched: false });
    const { getByRole } = await renderScreen();
    expect(getByRole('button', { name: t.game.validate }).props.accessibilityState.disabled).toBe(true);
  });

  it('falls back to the first palette color and to empty labels while this device is not listed yet', async () => {
    setGame({ players: {}, onlinePlayers: [MAX], myIndex: -1, totals: [300] });
    const { getByText } = await renderScreen();
    expect(getByText('Berlin')).toBeTruthy();
  });
});

describe('OnlineGameScreen — submitted, others still answering', () => {
  it('waits for the others', async () => {
    setGame({ gameState: gameState({ guesses: { zoe: { bearing: 10, distanceKm: 500 } } }) });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.waitingForOthers)).toBeTruthy();
  });
});

describe('OnlineGameScreen — submitted, everyone answered, not yet revealed', () => {
  it('still waits, with the true heading computed locally', async () => {
    setGame({
      gameState: gameState({
        guesses: { zoe: { bearing: 10, distanceKm: 500 }, max: { bearing: 20, distanceKm: 600 } },
      }),
    });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.waitingForOthers)).toBeTruthy();
  });
});

describe('OnlineGameScreen — revealed', () => {
  const revealed = (overrides: Record<string, unknown> = {}, screenOverrides: Partial<RoomGameState> = {}) =>
    setGame({
      gameState: gameState({
        screen: 'reveal',
        guesses: { zoe: { bearing: 50, distanceKm: 900 }, max: { bearing: 70, distanceKm: 800 } },
        scores: { zoe: record.results[0].score, max: record.results[1].score },
        ...screenOverrides,
      }),
      records: [record],
      ...overrides,
    });

  it('lets the host go to the next round', async () => {
    revealed();
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText(t.game.next));
    expect((mockGame.goToNextRound as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('offers the score after the last round', async () => {
    revealed({}, { roundIndex: 1 });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.last)).toBeTruthy();
  });

  it('does not crash when a player who never answered comes back during the reveal', async () => {
    // Zoé and Max answered, the round was scored without Eve; Eve is back in the room now.
    revealed({ onlinePlayers: [ZOE, MAX, EVE], totals: [850, 300, 0] });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.next)).toBeTruthy();
  });

  it('does not crash when the players were reordered since the round was scored', async () => {
    revealed({ onlinePlayers: [MAX, ZOE], myIndex: 1, totals: [300, 850] });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.next)).toBeTruthy();
  });

  it('does not crash when a player who answered has left', async () => {
    revealed({ onlinePlayers: [ZOE], totals: [850] });
    const { getByText } = await renderScreen();
    expect(getByText(t.game.next)).toBeTruthy();
  });

  it('gives a joiner nothing to press: it waits for the host', async () => {
    revealed({ isHost: false });
    const { queryByText } = await renderScreen();
    expect(queryByText(t.game.next)).toBeNull();
    expect(queryByText(t.game.last)).toBeNull();
  });
});
