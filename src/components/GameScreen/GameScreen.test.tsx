import { fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_SETTINGS } from '@/constants';
import { ThemeSettingsContext, day } from '@/themes';
import type { GamePhase, Guess, Place, Player, RoundRecord } from '@/types';

import GameScreen from '.';
import { useGame } from './useGame';

jest.mock('./useGame');

const mockedUseGame = useGame as jest.Mock;

const place: Place = {
  name: 'Berlin',
  code: 'DE',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  category: 'cities',
  difficulty: 'easy',
};

const scoreFixture = {
  trueBearing: 90,
  trueInclination: 0,
  trueSurfaceDistanceKm: 1000,
  trueStraightDistanceKm: 900,
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

const soloPlayers: Player[] = [{ name: 'Zoé', color: '#EF4444' }];
const multiPlayers: Player[] = [
  { name: 'Zoé', color: '#EF4444' },
  { name: 'Max', color: '#16A34A' },
];

const record: RoundRecord = {
  place,
  results: [{ guess: { bearing: 80, distanceKm: 950, inclination: 0 }, score: scoreFixture }],
};

const baseGame = {
  phase: 'guess' as GamePhase,
  config: DEFAULT_SETTINGS,
  players: soloPlayers,
  isMultiplayer: false,
  currentPlayer: soloPlayers[0],
  activePlayerIndex: 0,
  roundOrder: [0],
  answered: [] as { player: Player; guess: Guess; index: number }[],
  answeredByPlayer: [false],
  origin: { name: 'Paris', coordinates: { latitude: 48.8566, longitude: 2.3522 }, isDevicePosition: false },
  place,
  roundNumber: 1,
  totalRounds: 5,
  bearing: 90,
  distanceKm: 1000,
  bearingTouched: false,
  distanceTouched: false,
  maxDistanceKm: 20000,
  records: [] as RoundRecord[],
  currentRecord: undefined as RoundRecord | undefined,
  totals: [0],
  setBearing: jest.fn(),
  setDistanceKm: jest.fn(),
  selectPlayer: jest.fn(),
  submit: jest.fn(),
  next: jest.fn(),
  restart: jest.fn(),
};

const mockGame = (overrides: Partial<typeof baseGame>) => {
  mockedUseGame.mockReturnValue({ ...baseGame, ...overrides });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGame({});
});

describe('GameScreen — loading', () => {
  it('shows a loading indicator while the phase is "loading"', async () => {
    mockGame({ phase: 'loading' });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Préparation de la partie…')).toBeTruthy();
  });

  it('also shows loading if the place is not resolved yet, even outside the "loading" phase', async () => {
    mockGame({ place: undefined });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Préparation de la partie…')).toBeTruthy();
  });

  it('also shows loading if the current player is not resolved yet', async () => {
    mockGame({ currentPlayer: undefined });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Préparation de la partie…')).toBeTruthy();
  });
});

describe('GameScreen — end phase', () => {
  it('renders the EndScreen and forwards restart/onQuit', async () => {
    const onQuit = jest.fn();
    mockGame({ phase: 'end', records: [record], totals: [850] });
    const { getByText } = await render(<GameScreen onQuit={onQuit} />);
    await fireEvent.press(getByText('Rejouer'));
    expect(baseGame.restart).toHaveBeenCalled();
    await fireEvent.press(getByText('Accueil'));
    expect(onQuit).toHaveBeenCalled();
  });
});

describe('GameScreen — guess phase, solo', () => {
  it('shows the place, compass, and distance slider; quit calls onQuit', async () => {
    const onQuit = jest.fn();
    const { getByText } = await render(<GameScreen onQuit={onQuit} />);
    expect(getByText('Berlin')).toBeTruthy();
    await fireEvent.press(getByText('✕  Quitter'));
    expect(onQuit).toHaveBeenCalled();
  });

  it('disables Valider until both bearing and distance are touched', async () => {
    mockGame({ bearingTouched: false, distanceTouched: false });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Valider').parent?.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables Valider and calls submit once both are touched', async () => {
    mockGame({ bearingTouched: true, distanceTouched: true });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    await fireEvent.press(getByText('Valider'));
    expect(baseGame.submit).toHaveBeenCalled();
  });

  it('toggles the footer nav button between "next" and "previous"', async () => {
    const { getByText, queryByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Suivant')).toBeTruthy();
    await fireEvent.press(getByText('Suivant'));
    expect(queryByText('Suivant')).toBeNull();
    expect(getByText('Précédent')).toBeTruthy();
    await fireEvent.press(getByText('Précédent'));
    expect(getByText('Suivant')).toBeTruthy();
  });

  it('shows the straight-line inclination slider instead of the distance slider when straightLine is on', async () => {
    mockGame({ config: { ...DEFAULT_SETTINGS, straightLine: true } });
    const { getByLabelText, queryByLabelText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByLabelText('Inclinaison')).toBeTruthy();
    expect(queryByLabelText('Distance estimée')).toBeNull();
  });

  it('shows the country when showCountry is on', async () => {
    mockGame({ config: { ...DEFAULT_SETTINGS, showCountry: true } });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText(/Allemagne/)).toBeTruthy();
  });
});

describe('GameScreen — guess phase, multiplayer', () => {
  it('shows player tabs, the turn popup, and lets it be dismissed', async () => {
    mockGame({
      players: multiPlayers,
      isMultiplayer: true,
      currentPlayer: multiPlayers[0],
      roundOrder: [0, 1],
      answeredByPlayer: [false, false],
      totals: [0, 0],
    });
    const { getAllByText } = await render(<GameScreen onQuit={jest.fn()} />);
    // "À Zoé de jouer" appears twice: the active PlayerTabs label and the full-screen turn popup.
    expect(getAllByText(/de jouer/)).toHaveLength(2);
    await fireEvent.press(getAllByText(/de jouer/)[1]);
    // Dismissing the popup leaves only the PlayerTabs label.
    expect(getAllByText(/de jouer/)).toHaveLength(1);
  });

  it('switching player tabs calls selectPlayer', async () => {
    mockGame({
      players: multiPlayers,
      isMultiplayer: true,
      currentPlayer: multiPlayers[0],
      roundOrder: [0, 1],
      answeredByPlayer: [false, false],
      totals: [0, 0],
    });
    const { getByLabelText } = await render(<GameScreen onQuit={jest.fn()} />);
    await fireEvent.press(getByLabelText('Max'));
    expect(baseGame.selectPlayer).toHaveBeenCalledWith(1);
  });

  it('shows already-answered players faded on the compass/earth unless hideOtherAnswers is on', async () => {
    mockGame({
      players: multiPlayers,
      isMultiplayer: true,
      currentPlayer: multiPlayers[1],
      activePlayerIndex: 1,
      roundOrder: [0, 1],
      answered: [{ player: multiPlayers[0], guess: { bearing: 45, distanceKm: 500, inclination: 0 }, index: 0 }],
      answeredByPlayer: [true, false],
      totals: [0, 0],
    });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Zoé')).toBeTruthy();
  });

  it('hides other answers entirely when hideOtherAnswers is on', async () => {
    mockGame({
      config: { ...DEFAULT_SETTINGS, hideOtherAnswers: true },
      players: multiPlayers,
      isMultiplayer: true,
      currentPlayer: multiPlayers[1],
      activePlayerIndex: 1,
      roundOrder: [0, 1],
      answered: [{ player: multiPlayers[0], guess: { bearing: 45, distanceKm: 500, inclination: 0 }, index: 0 }],
      answeredByPlayer: [true, false],
      totals: [0, 0],
    });
    const { queryByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(queryByText('Zoé')).toBeNull();
  });
});

describe('GameScreen — reveal phase', () => {
  it('shows the round result, solo, and the "next round" button', async () => {
    mockGame({ phase: 'reveal', currentRecord: record, totals: [850], roundNumber: 1, totalRounds: 5 });
    const { getByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Manche suivante')).toBeTruthy();
    await fireEvent.press(getByText('Manche suivante'));
    expect(baseGame.next).toHaveBeenCalled();
  });

  it('shows "Voir le score" instead of "Manche suivante" on the last round', async () => {
    mockGame({ phase: 'reveal', currentRecord: record, totals: [850], roundNumber: 5, totalRounds: 5 });
    const { getByText, queryByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getByText('Voir le score')).toBeTruthy();
    expect(queryByText('Manche suivante')).toBeNull();
  });

  it('shows every player plus the truth in the legend, multiplayer', async () => {
    const multiRecord: RoundRecord = {
      place,
      results: [
        { guess: { bearing: 80, distanceKm: 950, inclination: 0 }, score: scoreFixture },
        { guess: { bearing: 95, distanceKm: 1010, inclination: 0 }, score: { ...scoreFixture, total: 900 } },
      ],
    };
    mockGame({
      phase: 'reveal',
      players: multiPlayers,
      isMultiplayer: true,
      currentRecord: multiRecord,
      totals: [850, 900],
      roundOrder: [0, 1],
      answeredByPlayer: [true, true],
    });
    const { getAllByText } = await render(<GameScreen onQuit={jest.fn()} />);
    expect(getAllByText('Zoé').length).toBeGreaterThan(0);
    expect(getAllByText('Max').length).toBeGreaterThan(0);
  });
});

describe('GameScreen — theme', () => {
  it('gives the header a white background by day instead of the page background', async () => {
    const { toJSON } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn(), animationsEnabled: false, setAnimationsEnabled: jest.fn(), resetAnimationsEnabled: jest.fn() }}
      >
        <GameScreen onQuit={jest.fn()} />
      </ThemeSettingsContext.Provider>,
    );
    expect(JSON.stringify(toJSON())).toContain(day.colors.surface);
  });
});
