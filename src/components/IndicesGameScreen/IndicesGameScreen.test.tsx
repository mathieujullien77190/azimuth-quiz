import { fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_INDICES_SETTINGS, INDICES_PLACES } from '@/constants';
import { resolveOrigin } from '@/helpers/location';
import { IndicesSettingsContext } from '@/settings';
import type { IndicesSettings } from '@/types';

import IndicesGameScreen from '.';

const PARIS = INDICES_PLACES.find((place) => place.name === 'Paris' && place.country === 'France')!;

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
    randomIndicesPlace: jest.fn(() => mockNextPlace),
  };
});

beforeEach(() => {
  mockNextPlace = PARIS;
});

const renderGame = async (overrides: Partial<IndicesSettings> = {}, onQuit = jest.fn()) => {
  const settings: IndicesSettings = { ...DEFAULT_INDICES_SETTINGS, ...overrides };
  const utils = await render(
    <IndicesSettingsContext.Provider value={{ settings, updateSettings: jest.fn() }}>
      <IndicesGameScreen onQuit={onQuit} />
    </IndicesSettingsContext.Provider>,
  );
  return { ...utils, onQuit, settings };
};

describe('IndicesGameScreen — picking clues', () => {
  it('shows the active player and the round indicator', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé', 'Max'], rounds: 5 });
    expect(getByText('À Zoé de jouer')).toBeTruthy();
    expect(getByText(/Manche 1 \/ 5/)).toBeTruthy();
  });

  it('revealing a clue takes 1 point off the remaining score and advances the turn', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé', 'Max'] });
    // Paris/France (3 flag colors): 24 possible clues in total, rounded up to 30.
    expect(getByText('Zoé · 30 pts')).toBeTruthy();

    await fireEvent.press(getByText('Indicatif tél.'));
    expect(getByText('À Max de jouer')).toBeTruthy();
    expect(getByText('Max · 29 pts')).toBeTruthy();
  });

  it('pressing an already-revealed single-shot clue again does not change the score', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Indicatif tél.'));
    expect(getByText('29 pts')).toBeTruthy();
    await fireEvent.press(getByText('Indicatif tél.'));
    expect(getByText('29 pts')).toBeTruthy();
  });

  it('pressing a header player tab is a no-op (display-only, unlike the buzz-panel tabs)', async () => {
    const { getByText, getAllByLabelText } = await renderGame({ playerNames: ['Zoé', 'Max'] });
    await fireEvent.press(getAllByLabelText('Max')[0]);
    // Still Zoé's turn: the header tabs don't change the active player.
    expect(getByText('À Zoé de jouer')).toBeTruthy();
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

    const scoreBefore = getByText(/pts$/).props.children.join('');
    // 4th click: nothing left to reveal, the score must not move anymore.
    await fireEvent.press(getByText(PARIS.emojis[2]));
    expect(getByText(/pts$/).props.children.join('')).toBe(scoreBefore);
  });

  it('handles a place whose country has no flag color data (empty flag, no crash)', async () => {
    mockNextPlace = { ...PARIS, code: 'XX' };
    const { getByText } = await renderGame({ playerNames: ['Zoé'] });
    expect(getByText(/pts/)).toBeTruthy();
  });

  it('shows the revealed first letter in the word-recap skeleton above the buzz row', async () => {
    const { getAllByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getAllByText('Première lettre')[0]);
    expect(getAllByText('P').length).toBeGreaterThan(0);
  });

  it('startWithFirstLetter: the first letter is already revealed (and already costs 1 point) at round start', async () => {
    const { getAllByText, getByText } = await renderGame({ playerNames: ['Zoé'], startWithFirstLetter: true });
    expect(getByText('29 pts')).toBeTruthy();
    expect(getAllByText('P').length).toBeGreaterThan(0);
  });

  it('startWithFirstLetter: the next round also starts with it revealed', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'], rounds: 2, startWithFirstLetter: true });
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    await fireEvent.press(getByText('Continuer'));
    expect(getByText('29 pts')).toBeTruthy();
  });

  it('flag colors reveal one by one for the 3-color France flag then lock', async () => {
    const { getByText, getAllByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Drapeau'));
    expect(getAllByText('33%')).toHaveLength(1);
    expect(getAllByText('?')).toHaveLength(2);

    await fireEvent.press(getAllByText('33%')[0]);
    expect(getAllByText('33%')).toHaveLength(2);

    await fireEvent.press(getAllByText('33%')[0]);
    expect(getAllByText('33%')).toHaveLength(3);
  });
});

describe('IndicesGameScreen — buzz flow (spoken)', () => {
  it('lets the buzzing player be picked, verified, and settled correct', async () => {
    const { getByText, getAllByLabelText } = await renderGame({ answerMethod: 'spoken', playerNames: ['Zoé'] });
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    expect(getByText('Qui buzze ?')).toBeTruthy();
    await fireEvent.press(getAllByLabelText('Zoé')[1]);
    expect(getByText(/Zoé buzze/)).toBeTruthy();
    await fireEvent.press(getByText('Vérifier'));
    await fireEvent.press(getByText('✓ Bonne réponse'));
    // No clue taken: the remaining (thus won) score is still at the maximum (30).
    expect(getByText('Zoé marque 30 points !')).toBeTruthy();
    expect(getByText('Continuer')).toBeTruthy();
  });

  it('settles a wrong answer with a fixed penalty, but keeps the round open for another buzz', async () => {
    const { getByText, getAllByLabelText, queryByText } = await renderGame({
      answerMethod: 'spoken',
      playerNames: ['Zoé', 'Max'],
    });
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    await fireEvent.press(getAllByLabelText('Zoé')[1]);
    await fireEvent.press(getByText('Vérifier'));
    await fireEvent.press(getByText('✕ Faux'));
    // Fixed penalty (WRONG_ANSWER_PENALTY = 10), regardless of how many clues had been taken.
    expect(getByText('Zoé se trompe — perd 10 points.')).toBeTruthy();
    // No reveal, no "Continuer" — the round stays open, anyone (including Zoé again) can re-buzz.
    expect(queryByText('Continuer')).toBeNull();
    expect(queryByText(PARIS.name)).toBeNull();
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    await fireEvent.press(getAllByLabelText('Max')[1]);
    await fireEvent.press(getByText('Vérifier'));
    await fireEvent.press(getByText('✓ Bonne réponse'));
    expect(getByText('Max marque 30 points !')).toBeTruthy();
  });

  it('cancels a buzz (wrong player, accidental click...) without touching the score', async () => {
    const { getByText, getAllByLabelText, queryByText } = await renderGame({ answerMethod: 'spoken', playerNames: ['Zoé'] });
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    await fireEvent.press(getAllByLabelText('Zoé')[1]);
    await fireEvent.press(getByText('Vérifier'));
    await fireEvent.press(getByText('Annuler'));
    expect(queryByText('✓ Bonne réponse')).toBeNull();
    expect(getByText('🔔 J’ai trouvé !')).toBeTruthy();
  });

  it('asks who buzzes and lets any player be selected before verifying', async () => {
    const { getByText, getAllByLabelText } = await renderGame({
      answerMethod: 'spoken',
      playerNames: ['Zoé', 'Max'],
    });
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    expect(getByText('Qui buzze ?')).toBeTruthy();
    await fireEvent.press(getAllByLabelText('Max')[1]);
    expect(getByText(/Max buzze/)).toBeTruthy();
    await fireEvent.press(getByText('Vérifier'));
    await fireEvent.press(getByText('✓ Bonne réponse'));
    expect(getByText('Max marque 30 points !')).toBeTruthy();
  });
});

describe('IndicesGameScreen — buzz flow (typed answer)', () => {
  it('submit button is disabled until text is entered, wrong guess is scored as wrong', async () => {
    const { getByText, getAllByLabelText, getByPlaceholderText } = await renderGame({
      answerMethod: 'typed',
      playerNames: ['Zoé'],
    });
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    await fireEvent.press(getAllByLabelText('Zoé')[1]);
    const input = getByPlaceholderText('Nom de la ville…');
    await fireEvent.changeText(input, 'Berlin');
    await fireEvent.press(getByText('Valider'));
    expect(getByText(/Zoé se trompe/)).toBeTruthy();
  });

  it('the text input only appears after a player is picked, correct guess scores correctly', async () => {
    const { getByText, getAllByLabelText, queryByPlaceholderText, getByPlaceholderText } = await renderGame({
      answerMethod: 'typed',
      playerNames: ['Zoé', 'Max'],
    });
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    expect(queryByPlaceholderText('Nom de la ville…')).toBeNull();
    await fireEvent.press(getAllByLabelText('Zoé')[1]);
    const input = getByPlaceholderText('Nom de la ville…');
    await fireEvent.changeText(input, '  paris  ');
    await fireEvent.press(getByText('Valider'));
    expect(getByText('Zoé marque 30 points !')).toBeTruthy();
  });
});

describe('IndicesGameScreen — give up', () => {
  it('ends the round with no name attached and no penalty to anyone', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('Population'));
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    expect(getByText('Personne n’a trouvé — 0 point, on tourne la page.')).toBeTruthy();
    expect(getByText(/C’était/)).toBeTruthy();
  });
});

describe('IndicesGameScreen — round progression', () => {
  it('Continuer advances to the next round and resets the clue grid and score', async () => {
    const { getByText } = await renderGame({ playerNames: ['Zoé'], rounds: 2 });
    await fireEvent.press(getByText('Population'));
    await fireEvent.press(getByText('🤷 Je ne sais pas'));
    await fireEvent.press(getByText('Continuer'));
    expect(getByText(/Manche 2 \/ 2/)).toBeTruthy();
    // New round: the remaining score starts back at the maximum (30), not 0.
    expect(getByText('30 pts')).toBeTruthy();
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
    const { getByText, getAllByLabelText } = await renderGame({
      answerMethod: 'spoken',
      playerNames: ['Zoé', 'Max'],
      rounds: 2,
    });
    // Round 1: Max reveals a clue then finds it, their penalty = the cost of that clue (3).
    await fireEvent.press(getByText('Population'));
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    await fireEvent.press(getAllByLabelText('Max')[1]);
    await fireEvent.press(getByText('Vérifier'));
    await fireEvent.press(getByText('✓ Bonne réponse'));
    await fireEvent.press(getByText('Continuer'));
    // Round 2: Zoé buzzes in and finds it with no clue, their cumulative total stays at 0.
    await fireEvent.press(getByText('🔔 J’ai trouvé !'));
    await fireEvent.press(getAllByLabelText('Zoé')[1]);
    await fireEvent.press(getByText('Vérifier'));
    await fireEvent.press(getByText('✓ Bonne réponse'));
    await fireEvent.press(getByText('Voir le score'));
    // Zoé (0) beats Max (3): a single winner, no tie.
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

describe('IndicesGameScreen — quitting', () => {
  it('the quit button calls onQuit at any time', async () => {
    const { getByText, onQuit } = await renderGame({ playerNames: ['Zoé'] });
    await fireEvent.press(getByText('✕  Quitter'));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});

describe('IndicesGameScreen — origin resolution cleanup', () => {
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
