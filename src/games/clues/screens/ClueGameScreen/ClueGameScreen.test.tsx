import { fireEvent, render } from '@testing-library/react-native';

import { CLUE_PLACES } from '@/data';
import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { resolveOrigin } from '@/helpers/location';
import { useClueSettings } from '@/settings';
import { ThemeSettingsContext, day } from '@/themes';
import type { ClueSettings } from '@/types';

import ClueGameScreen from '.';

const PARIS = CLUE_PLACES.find((place) => place.name === 'Paris' && place.country === 'France')!;

jest.mock('@/helpers/location', () => ({
  resolveOrigin: jest.fn().mockResolvedValue({
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    isDevicePosition: false,
    name: 'Paris',
  }),
}));

let mockNextPlace = PARIS;
jest.mock('./helpers', () => {
  const actual = jest.requireActual('./helpers');
  return {
    ...actual,
    randomCluePlace: jest.fn(() => mockNextPlace),
  };
});

beforeEach(() => {
  mockNextPlace = PARIS;
});

const renderGame = async (overrides: Partial<ClueSettings> = {}, onQuit = jest.fn()) => {
  // Defaults to off here regardless of DEFAULT_CLUE_SETTINGS: most of these tests are about
  // other mechanics and assume a clean 30pts start — the dedicated startWithFirstLetter tests
  // below already override this explicitly.
  const settings: ClueSettings = { ...DEFAULT_CLUE_SETTINGS, startWithFirstLetter: false, ...overrides };
  useClueSettings.setState({ settings, updateSettings: jest.fn() });
  const utils = await render(<ClueGameScreen onQuit={onQuit} />);
  return { ...utils, onQuit, settings };
};

describe('ClueGameScreen — picking clues', () => {
  it('shows the active player and the round indicator', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé', 'Max'], rounds: 5 });
    expect(getByText('À Zoé de jouer')).toBeTruthy();
    expect(getByText(/Manche 1 \/ 5/)).toBeTruthy();
  });

  it('revealing a clue takes 1 point off the remaining score and advances the turn', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé', 'Max'] });
    // Paris/France (3 flag colors): 25 possible clues in total, rounded up to 30.
    expect(getByText('30 pts en jeu')).toBeTruthy();

    await fireEvent.press(getByText('Indicatif tél.'));
    expect(getByText('À Max de jouer')).toBeTruthy();
    expect(getByText('29 pts en jeu')).toBeTruthy();
  });

  it('pressing an already-revealed single-shot clue again does not change the score', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Indicatif tél.'));
    expect(getByText('29 pts en jeu')).toBeTruthy();
    await fireEvent.press(getByText('Indicatif tél.'));
    expect(getByText('29 pts en jeu')).toBeTruthy();
  });

  it('emoji reveals progressively over 3 clicks then locks', async () => {
    const { getByText, getAllByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Emoji'));
    expect(getByText(PARIS.emojis[0])).toBeTruthy();
    expect(getAllByText('❓')).toHaveLength(2);

    await fireEvent.press(getByText(PARIS.emojis[0]));
    expect(getByText(PARIS.emojis[1])).toBeTruthy();

    await fireEvent.press(getByText(PARIS.emojis[1]));
    expect(getByText(PARIS.emojis[2])).toBeTruthy();

    const scoreBefore = getByText(/pts en jeu$/).props.children;
    // 4th click: nothing left to reveal, the score must not move anymore.
    await fireEvent.press(getByText(PARIS.emojis[2]));
    expect(getByText(/pts en jeu$/).props.children).toBe(scoreBefore);
  });

  it('handles a place whose country has no flag color data (empty flag, no crash)', async () => {
    mockNextPlace = { ...PARIS, code: 'XX' };
    const { getByText } = await renderGame({ playerNames: ['Zoé'] });
    expect(getByText(/pts en jeu/)).toBeTruthy();
  });

  it('shows the revealed first letter in the word-recap skeleton above the buzz row', async () => {
    const { getAllByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getAllByText('Lettres')[0]);
    expect(getAllByText('P').length).toBeGreaterThan(0);
  });

  it('letter: 3 clicks go first letter -> word count (no visible change, single word) -> real length', async () => {
    const { getAllByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getAllByText('Lettres')[0]);
    expect(getAllByText('P').length).toBeGreaterThan(0);

    // 2nd click: word count, but "Paris" is a single word so nothing new to show.
    await fireEvent.press(getAllByText('P')[0]);
    expect(getAllByText('P').length).toBeGreaterThan(0);

    // 3rd click: real length.
    await fireEvent.press(getAllByText('P')[0]);
    expect(getAllByText('P____').length).toBeGreaterThan(0);
  });

  it('startWithFirstLetter: the first letter is already revealed (and already costs 1 point) at round start', async () => {
    const { getAllByText, getByText } = await renderGame({ playerNames: ['Zoé'], startWithFirstLetter: true });
    expect(getByText('29 pts en jeu')).toBeTruthy();
    expect(getAllByText('P').length).toBeGreaterThan(0);
  });

  it('startWithFirstLetter: the next round also starts with it revealed', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'], rounds: 2, startWithFirstLetter: true });
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    await fireEvent.press(getByText('Continuer'));
    expect(getByText('29 pts en jeu')).toBeTruthy();
  });

  it('startWithFirstLetter: 2 more clicks (word count then real length) reach the full skeleton', async () => {
    const { getAllByText } = await renderGame({ playerNames: ['Zoé'], startWithFirstLetter: true });
    await fireEvent.press(getAllByText('P')[0]);
    await fireEvent.press(getAllByText('P')[0]);
    expect(getAllByText('P____').length).toBeGreaterThan(0);
  });

  it('flag colors reveal one click, then the actual flag, then locks', async () => {
    const { getByText, getAllByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Drapeau'));
    expect(getAllByText('33%')).toHaveLength(1);

    // 2nd click: every color at once, however many the flag actually has.
    await fireEvent.press(getAllByText('33%')[0]);
    expect(getAllByText('33%')).toHaveLength(3);

    // 3rd click: swaps the color swatches for the actual flag.
    await fireEvent.press(getAllByText('33%')[0]);
    expect(getByText('🇫🇷')).toBeTruthy();

    // 4th click: nothing left to reveal, the score must not move anymore.
    const scoreBefore = getByText(/pts en jeu$/).props.children;
    await fireEvent.press(getByText('🇫🇷'));
    expect(getByText(/pts en jeu$/).props.children).toBe(scoreBefore);
  });
});

describe('ClueGameScreen — vowels bonus clue', () => {
  // One label per entry of CLUE_ORDER, in order — a single press each is enough to
  // "touch" every real clue without needing to exhaust any multi-stage one.
  const ALL_OTHER_LABELS = [
    'Population',
    'Heure locale',
    'Lettres',
    'Capitale',
    'Cap',
    'Distance',
    'Climat',
    'Emoji',
    'Drapeau',
    'Position',
    'Altitude',
    'Code aéroport',
    'Devise',
    'Indicatif tél.',
  ];

  it('stays hidden until every other clue has been picked at least once', async () => {
    const { getByText, queryByText } = await renderGame({ playerNames: ['Zoé'] });
    expect(queryByText('Voyelles')).toBeNull();

    for (const label of ALL_OTHER_LABELS.slice(0, -1)) {
      await fireEvent.press(getByText(label));
    }
    expect(queryByText('Voyelles')).toBeNull();

    await fireEvent.press(getByText(ALL_OTHER_LABELS[ALL_OTHER_LABELS.length - 1]));
    expect(getByText('Voyelles')).toBeTruthy();
  });

  it('shows every vowel and drops the score to 1 (not up) when picked', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'] });
    for (const label of ALL_OTHER_LABELS) {
      await fireEvent.press(getByText(label));
    }
    // 14 real clues picked, score still comfortably above 1.
    expect(getByText(/pts en jeu$/).props.children).not.toBe('1 pts en jeu');

    await fireEvent.press(getByText('Voyelles'));
    expect(getByText('A I')).toBeTruthy();
    expect(getByText('1 pts en jeu')).toBeTruthy();
  });

  it('stays visible but display-only once the round is over', async () => {
    const { getByText, queryByRole } = await renderGame({ playerNames: ['Zoé'] });
    for (const label of ALL_OTHER_LABELS) {
      await fireEvent.press(getByText(label));
    }
    await fireEvent.press(getByText('🤷 Je ne sais pas'));

    expect(getByText('Voyelles')).toBeTruthy();
    expect(queryByRole('button', { name: /Voyelles/ })).toBeNull();
  });
});

describe('ClueGameScreen — typed answer flow', () => {
  it('the input is visible from the start, wrong guess is scored as wrong', async () => {
    const { getByText, getByPlaceholderText } = await renderGame({
      playerNames: ['Zoé', 'Max'],
    });
    const input = getByPlaceholderText('Nom de la ville…');
    await fireEvent.changeText(input, 'Berlin');
    await fireEvent.press(getByText('Valider'));
    await fireEvent.press(getByText('Zoé'));
    expect(getByText(/Zoé se trompe/)).toBeTruthy();
  });

  it('solo play settles immediately on "Valider" without the "who answered" overlay (only one possible answerer)', async () => {
    const { getByText, queryByText, getByPlaceholderText } = await renderGame({
      playerNames: ['Zoé'],
    });
    const input = getByPlaceholderText('Nom de la ville…');
    await fireEvent.changeText(input, 'paris');
    await fireEvent.press(getByText('Valider'));
    expect(queryByText('Qui a répondu ?')).toBeNull();
    expect(getByText('Zoé marque 30 points !')).toBeTruthy();
  });

  it('keeps the round open and the miss banner/letter recap visible after a wrong typed guess (no reveal, unlike spoken mode)', async () => {
    const { getByText, getAllByText, queryByText, getByPlaceholderText } = await renderGame({
      playerNames: ['Zoé', 'Max'],
    });
    await fireEvent.press(getAllByText('Lettres')[0]);
    const input = getByPlaceholderText('Nom de la ville…');
    await fireEvent.changeText(input, 'Berlin');
    await fireEvent.press(getByText('Valider'));
    await fireEvent.press(getByText('Zoé'));
    expect(getByText('Zoé se trompe — perd 10 points.')).toBeTruthy();
    expect(getAllByText('P').length).toBeGreaterThan(0);
    // No reveal, no "Continuer" — the round stays open, anyone (including Zoé again) can retry.
    expect(queryByText('Continuer')).toBeNull();
    expect(queryByText(PARIS.name)).toBeNull();

    await fireEvent.changeText(input, 'Paris');
    await fireEvent.press(getByText('Valider'));
    await fireEvent.press(getByText('Max'));
    // 1 clue picked (Lettres) before the wrong guess: max score is 29, not 30.
    expect(getByText('Max marque 29 points !')).toBeTruthy();
  });

  it('correct guess scores correctly', async () => {
    const { getByText, getByPlaceholderText } = await renderGame({
      playerNames: ['Zoé', 'Max'],
    });
    const input = getByPlaceholderText('Nom de la ville…');
    await fireEvent.changeText(input, '  paris  ');
    await fireEvent.press(getByText('Valider'));
    await fireEvent.press(getByText('Zoé'));
    expect(getByText('Zoé marque 30 points !')).toBeTruthy();
  });

  it('once the real length is known (letter, 2nd click), typing live-fills the skeleton and blocks extra letters', async () => {
    const { getAllByText, getByPlaceholderText } = await renderGame({
      playerNames: ['Zoé'],
    });
    await fireEvent.press(getAllByText('Lettres')[0]);
    await fireEvent.press(getAllByText('P')[0]);

    const input = getByPlaceholderText('Nom de la ville…');

    await fireEvent.changeText(input, 'Pa');
    expect(getAllByText('A').length).toBeGreaterThan(0);

    // "Paris" has 5 letters: a 6th is refused, the input stays at its previous value.
    await fireEvent.changeText(input, 'Parisx');
    expect(input.props.value).toBe('Pa');
  });
});

describe('ClueGameScreen — give up', () => {
  it('solo: names the one player instead of the generic "nobody"', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Population'));
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    expect(getByText('Zoé n’a pas trouvé — 0 point.')).toBeTruthy();
    expect(getByText(/C’était/)).toBeTruthy();
  });

  it('multiplayer: ends the round with the generic "nobody found it" message, no penalty to anyone', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé', 'Max'] });
    await fireEvent.press(getByText('Population'));
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    expect(getByText('Personne n’a trouvé — 0 point.')).toBeTruthy();
    expect(getByText(/C’était/)).toBeTruthy();
  });
});

describe('ClueGameScreen — round progression', () => {
  it('Continuer advances to the next round and resets the clue grid and score', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'], rounds: 2 });
    await fireEvent.press(getByText('Population'));
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    await fireEvent.press(getByText('Continuer'));
    expect(getByText(/Manche 2 \/ 2/)).toBeTruthy();
    // New round: the remaining score starts back at the maximum (30), not 0.
    expect(getByText('30 pts en jeu')).toBeTruthy();
  });

  it('shows "Voir le score" on the last round and moves to final standings on press', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'], rounds: 1 });
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    expect(getByText('Voir le score')).toBeTruthy();
    await fireEvent.press(getByText('Voir le score'));
    expect(getByText('Classement final')).toBeTruthy();
    expect(getByText('Zoé')).toBeTruthy();
  });

  it('final standings: shows a single-winner banner when totals differ', async () => {
    const { getByText, getByPlaceholderText } = await renderGame({
      playerNames: ['Zoé', 'Max'],
      rounds: 2,
    });
    // Round 1: Max reveals a clue then finds it — remaining score is 29, not the full 30.
    await fireEvent.press(getByText('Population'));
    await fireEvent.changeText(getByPlaceholderText('Nom de la ville…'), 'Paris');
    await fireEvent.press(getByText('Valider'));
    await fireEvent.press(getByText('Max'));
    await fireEvent.press(getByText('Continuer'));
    // Round 2: Zoé finds it with no clue picked at all — the full 30.
    await fireEvent.changeText(getByPlaceholderText('Nom de la ville…'), 'Paris');
    await fireEvent.press(getByText('Valider'));
    await fireEvent.press(getByText('Zoé'));
    await fireEvent.press(getByText('Voir le score'));
    // Zoé (30) beats Max (29): a single winner, no tie.
    expect(getByText('Zoé gagne !')).toBeTruthy();
  });

  it('final standings: shows a tie banner when totals are equal', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé', 'Max'], rounds: 1 });
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    await fireEvent.press(getByText('Voir le score'));
    expect(getByText(/Égalité/)).toBeTruthy();
  });

  it('final standings: shows no winner banner in solo play', async () => {
    const { queryByText, getByText } = await renderGame({ playerNames: ['Zoé'], rounds: 1 });
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    await fireEvent.press(getByText('Voir le score'));
    expect(queryByText(/gagne|Égalité/)).toBeNull();
  });

  it('Accueil on the final standings screen calls onQuit', async () => {
    const { getByText, onQuit } = await renderGame({ playerNames: ['Zoé'], rounds: 1 });
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    await fireEvent.press(getByText('Voir le score'));
    await fireEvent.press(getByText('Accueil'));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});

describe('ClueGameScreen — quitting', () => {
  it('the quit button calls onQuit at any time', async () => {
    const { getByText, onQuit } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('✕  Quitter'));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});

describe('ClueGameScreen — origin resolution cleanup', () => {
  it('does not update state after unmount if resolveOrigin settles late', async () => {
    let resolvePending: (value: unknown) => void = () => {};
    (resolveOrigin as jest.Mock).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePending = resolve;
      }),
    );

    const { unmount } = await renderGame({ playerNames: ['Zoé'] });
    await unmount();
    // Resolves AFTER unmount: the effect's `cancelled` must prevent any setState.
    resolvePending({ coordinates: { latitude: 0, longitude: 0 }, isDevicePosition: true, name: 'device' });
    await Promise.resolve();
  });
});

describe('ClueGameScreen — theme', () => {
  it('gives the header a white background by day instead of the page background', async () => {
    const settings: ClueSettings = { ...DEFAULT_CLUE_SETTINGS, startWithFirstLetter: false };
    useClueSettings.setState({ settings, updateSettings: jest.fn() });
    const { toJSON } = await render(
      <ThemeSettingsContext.Provider
        value={{
          themeId: 'day',
          ready: true,
          setThemeId: jest.fn(),
          resetThemeId: jest.fn(),
          animationsEnabled: false,
          setAnimationsEnabled: jest.fn(),
          resetAnimationsEnabled: jest.fn(),
        }}
      >
        <ClueGameScreen onQuit={jest.fn()} />
      </ThemeSettingsContext.Provider>,
    );
    expect(JSON.stringify(toJSON())).toContain(day.colors.surface);
  });
});
