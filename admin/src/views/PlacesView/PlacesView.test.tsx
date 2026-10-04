import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaceRow } from '../../api/places';

const mocks = vi.hoisted(() => ({
  fetchPlaces: vi.fn(),
  deletePlace: vi.fn(),
  saveCompass: vi.fn(),
  saveClues: vi.fn(),
  saveDifficulty: vi.fn(),
}));

vi.mock('../../api/places', () => mocks);
vi.mock('../../constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../constants')>()),
  countryFor: (code: string) => ({ FR: 'France', IT: 'Italie' })[code] ?? code,
}));
vi.mock('./WordplayEditor', () => ({ WordplayEditor: () => <div>wordplay-editor</div> }));
vi.mock('./PersonalityEditor', () => ({ PersonalityEditor: () => <div>personality-editor</div> }));

import { PlacesView } from './PlacesView';

const clues = (over: object = {}) => ({
  difficulty: 'easy',
  positionInCountry: 'n',
  population: 2000000,
  climateEmoji: '☀️',
  elevationMeters: 35,
  timezone: 'Europe/Paris',
  phoneCode: '+33',
  currency: 'EUR',
  airportCode: 'CDG',
  emojis: ['🗼', '🥖', '🍷'],
  ...over,
});

const PARIS = {
  key: 'par',
  name: 'Paris',
  code: 'FR',
  coordinates: { latitude: 48.8566, longitude: 2.35 },
  compass: {
    category: 'capital',
    difficulty: 'easy',
    description: 'La ville lumière',
    wikiFr: 'Paris',
    wikiEn: 'Paris',
  },
  clues: clues(),
} as unknown as PlaceRow;

const ROME = {
  key: 'rom',
  name: 'Rome',
  code: 'IT',
  coordinates: { latitude: -41.9, longitude: -12.5 },
  compass: { category: 'cities', difficulty: 'hard' },
  clues: null,
} as unknown as PlaceRow;

const NICE = {
  key: 'nic',
  name: 'Nice',
  code: 'FR',
  coordinates: { latitude: 43.7, longitude: 7.26 },
  compass: null,
  clues: clues({ difficulty: 'intermediate', emojis: ['🌴', '', ''] }),
} as unknown as PlaceRow;

const cardOf = (name: string) =>
  screen.getByText(name, { selector: '.place-name' }).closest('.place-card') as HTMLElement;

const countLine = () => document.querySelector('.count-line')?.textContent;

const renderView = async () => {
  render(<PlacesView />);
  await screen.findByText(/lieux? affichés? sur/);
};

beforeEach(() => {
  mocks.fetchPlaces.mockResolvedValue([PARIS, ROME, NICE]);
  mocks.saveDifficulty.mockImplementation(async (row: PlaceRow, difficulty: string) => ({
    compass: row.compass && { ...row.compass, difficulty },
    clues: row.clues && { ...row.clues, difficulty },
  }));
  mocks.saveCompass.mockImplementation(async (row: PlaceRow, patch: object) => ({ ...row.compass, ...patch }));
  mocks.saveClues.mockImplementation(async (row: PlaceRow, patch: object) => ({ ...row.clues, ...patch }));
  mocks.deletePlace.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('PlacesView loading', () => {
  it('shows a loading message, then the cards', async () => {
    render(<PlacesView />);
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    await screen.findByText(/lieux affichés sur/);
    expect(countLine()).toBe('3 lieux affichés sur 3');
  });

  it('shows the error when loading fails', async () => {
    mocks.fetchPlaces.mockRejectedValue(new Error('offline'));
    render(<PlacesView />);
    expect(await screen.findByText('Impossible de charger les lieux : offline')).toBeInTheDocument();
  });
});

describe('PlacesView cards', () => {
  it('shows identity, coordinates and the games each place belongs to', async () => {
    await renderView();
    const paris = within(cardOf('Paris'));
    expect(paris.getByText('France (FR)')).toBeInTheDocument();
    expect(paris.getByText('48.8566° N')).toBeInTheDocument();
    expect(paris.getByText('2.3500° E')).toBeInTheDocument();
    expect(paris.getByText('La ville lumière')).toBeInTheDocument();
    expect(paris.getByText('2 000 000', { exact: false })).toBeInTheDocument();
    expect(paris.getByText('35 m')).toBeInTheDocument();
    expect(paris.getByText('CDG')).toBeInTheDocument();
    expect(within(cardOf('Rome')).getByText('41.9000° S')).toBeInTheDocument();
    expect(within(cardOf('Rome')).getByText('12.5000° O')).toBeInTheDocument();
    expect(within(cardOf('Rome')).getByText(/Absent d’Clues/)).toBeInTheDocument();
    expect(within(cardOf('Nice')).getByText('Absent de Compass')).toBeInTheDocument();
    expect(within(cardOf('Nice')).getAllByRole('combobox')).toHaveLength(1);
  });
});

describe('PlacesView filters', () => {
  it('searches by name and shows the empty message when nothing matches', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.type(screen.getByRole('searchbox'), 'rom');
    expect(countLine()).toBe('1 lieu affiché sur 3');
    expect(screen.queryByText('Paris', { selector: '.place-name' })).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    expect(screen.getByText('Aucun lieu ne correspond à ces filtres.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(countLine()).toBe('3 lieux affichés sur 3');
  });

  it('filters by category and difficulty chips, and resets them', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(screen.getByRole('button', { name: /Capitales/ }));
    expect(screen.queryByText('Paris', { selector: '.place-name' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Facile/ }));
    await user.click(screen.getByRole('button', { name: /Moyen/ }));
    expect(screen.getByText('Rome', { selector: '.place-name' })).toBeInTheDocument();
    expect(screen.queryByText('Nice', { selector: '.place-name' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(countLine()).toBe('3 lieux affichés sur 3');
  });

  it('collapses and expands the filter panel', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(screen.getByRole('button', { name: '▲ Réduire' }));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '▼ Déplier' }));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('paginates and goes back to the first page when a filter changes', async () => {
    mocks.fetchPlaces.mockResolvedValue(
      Array.from({ length: 45 }, (_, i) => ({ ...ROME, key: `r${i}`, name: `Lieu${String(i).padStart(2, '0')}` })),
    );
    const user = userEvent.setup();
    await renderView();
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suivant →' }));
    expect(screen.getByText('Page 2 / 2')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'Lieu0');
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
  });
});

describe('PlacesView difficulty', () => {
  it('updates optimistically, saves, and flashes a check', async () => {
    const user = userEvent.setup();
    await renderView();
    const select = within(cardOf('Paris')).getAllByRole('combobox')[1];
    await user.selectOptions(select, 'hard');
    expect(mocks.saveDifficulty).toHaveBeenCalledWith(PARIS, 'hard');
    expect(await within(cardOf('Paris')).findByText('✓')).toBeInTheDocument();
    expect(within(cardOf('Paris')).getAllByRole('combobox')[1]).toHaveValue('hard');
    await waitFor(() => expect(screen.queryByText('✓')).not.toBeInTheDocument(), { timeout: 2500 });
  });

  it('reads the Clues difficulty when the place is not in Compass', async () => {
    const user = userEvent.setup();
    await renderView();
    const select = within(cardOf('Nice')).getByRole('combobox');
    expect(select).toHaveValue('intermediate');
    await user.selectOptions(select, 'easy');
    expect(mocks.saveDifficulty).toHaveBeenCalledWith(NICE, 'easy');
    await waitFor(() => expect(within(cardOf('Nice')).getByRole('combobox')).toHaveValue('easy'));
  });

  it('changes the difficulty of a place that is only in Compass', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.selectOptions(within(cardOf('Rome')).getAllByRole('combobox')[1], 'easy');
    expect(mocks.saveDifficulty).toHaveBeenCalledWith(ROME, 'easy');
    await waitFor(() => expect(within(cardOf('Rome')).getAllByRole('combobox')[1]).toHaveValue('easy'));
  });

  it('rolls back and shows a warning when the save fails', async () => {
    mocks.saveDifficulty.mockRejectedValue(new Error('denied'));
    const user = userEvent.setup();
    await renderView();
    await user.selectOptions(within(cardOf('Paris')).getAllByRole('combobox')[1], 'hard');
    const flag = await within(cardOf('Paris')).findByText('⚠');
    expect(flag).toHaveAttribute('title', 'denied');
    expect(within(cardOf('Paris')).getAllByRole('combobox')[1]).toHaveValue('easy');
  });
});

describe('PlacesView Compass edits', () => {
  it('changes the category and saves it', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.selectOptions(within(cardOf('Paris')).getAllByRole('combobox')[0], 'cities');
    expect(mocks.saveCompass).toHaveBeenCalledWith(PARIS, { category: 'cities' });
    expect(await within(cardOf('Paris')).findByText('✓')).toBeInTheDocument();
    expect(within(cardOf('Paris')).getAllByRole('combobox')[0]).toHaveValue('cities');
  });

  it('rolls back the category on failure', async () => {
    mocks.saveCompass.mockRejectedValue(new Error('nope'));
    const user = userEvent.setup();
    await renderView();
    await user.selectOptions(within(cardOf('Paris')).getAllByRole('combobox')[0], 'cities');
    expect(await within(cardOf('Paris')).findByText('⚠')).toHaveAttribute('title', 'nope');
    expect(within(cardOf('Paris')).getAllByRole('combobox')[0]).toHaveValue('capital');
  });

  it('saves a new description', async () => {
    const user = userEvent.setup();
    await renderView();
    const paris = within(cardOf('Paris'));
    await user.click(paris.getByRole('button', { name: 'Modifier' }));
    await user.clear(paris.getByRole('textbox'));
    await user.type(paris.getByRole('textbox'), ' Nouveau ');
    await user.click(paris.getByRole('button', { name: 'Enregistrer' }));
    expect(mocks.saveCompass).toHaveBeenCalledWith(PARIS, { description: 'Nouveau' });
    expect(await within(cardOf('Paris')).findByText('Nouveau')).toBeInTheDocument();
  });

  it('shows a dash for a place without description', async () => {
    mocks.fetchPlaces.mockResolvedValue([ROME]);
    await renderView();
    expect(within(cardOf('Rome')).getByText('—', { selector: '.desc-preview' })).toBeInTheDocument();
    expect(within(cardOf('Rome')).getByText('—', { selector: '.wiki-empty' })).toBeInTheDocument();
  });
});

describe('PlacesView Clues edits', () => {
  it('saves the population as a number', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(within(cardOf('Paris')).getByText(/2 000 000/));
    await user.keyboard('3000000{Enter}');
    expect(mocks.saveClues).toHaveBeenCalledWith(PARIS, { population: 3000000 });
    expect(await within(cardOf('Paris')).findByText(/3 000 000/)).toBeInTheDocument();
  });

  it('saves the climate emoji', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(within(cardOf('Paris')).getByText('☀️'));
    await user.keyboard('🌧️{Enter}');
    expect(mocks.saveClues).toHaveBeenCalledWith(PARIS, { climateEmoji: '🌧️' });
  });

  it('saves emojis as exactly three, padding missing ones', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(within(cardOf('Paris')).getByText('🗼 🥖 🍷'));
    await user.keyboard('🌊 🐚{Enter}');
    expect(mocks.saveClues).toHaveBeenCalledWith(PARIS, { emojis: ['🌊', '🐚', ''] });
  });

  it('pads with empty emojis when only one is given', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(within(cardOf('Nice')).getByText('🌴'));
    await user.keyboard('🌊{Enter}');
    expect(mocks.saveClues).toHaveBeenCalledWith(NICE, { emojis: ['🌊', '', ''] });
  });

  it('rolls back a Clues edit and warns when saving fails', async () => {
    mocks.saveClues.mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    await renderView();
    await user.click(within(cardOf('Paris')).getByText('☀️'));
    await user.keyboard('🌧️{Enter}');
    await user.click(await within(cardOf('Paris')).findByText('☀️'));
    expect(within(cardOf('Paris')).getByText('⚠')).toHaveAttribute('title', 'fail');
  });
});

describe('PlacesView delete', () => {
  it('deletes a place and removes its card', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(within(cardOf('Rome')).getByTitle('Supprimer « Rome »'));
    expect(mocks.deletePlace).toHaveBeenCalledWith(ROME);
    await waitFor(() => expect(screen.queryByText('Rome', { selector: '.place-name' })).not.toBeInTheDocument());
    expect(countLine()).toBe('2 lieux affichés sur 2');
  });
});
