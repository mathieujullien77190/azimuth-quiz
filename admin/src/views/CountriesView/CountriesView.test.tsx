import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CountryRecord } from '../../api/countries';

const mocks = vi.hoisted(() => ({
  fetchCountries: vi.fn(),
  saveCountry: vi.fn(),
  saveContourDifficulty: vi.fn(),
  allContours: vi.fn(),
}));

vi.mock('../../api/countries', () => ({
  fetchCountries: mocks.fetchCountries,
  saveCountry: mocks.saveCountry,
  saveContourDifficulty: mocks.saveContourDifficulty,
}));
vi.mock('../../api/contour', () => ({ allContours: mocks.allContours }));
vi.mock('../../data', () => ({ countryName: (code: string) => `name-${code}` }));
vi.mock('../ContourView', () => ({
  ContourEditor: ({ initialCountry, showNeighbors }: { initialCountry: { code: string }; showNeighbors: boolean }) => (
    <div>
      contour editor {initialCountry.code} {showNeighbors ? 'with neighbors' : 'alone'}
    </div>
  ),
}));

import { CountriesView } from './CountriesView';

const record = (over: Partial<CountryRecord> & { code: string }): CountryRecord => ({
  fr: `Fr ${over.code}`,
  en: `En ${over.code}`,
  flag: [['blue', '#0000FF', 100]],
  currency: 'Euro',
  currencySymbol: '€',
  phoneCode: '+33',
  neighbors: [],
  difficulty: null,
  ...over,
});

const FRANCE = record({ code: 'FR', fr: 'France', en: 'France', neighbors: ['ES', 'DE'], difficulty: 'easy' });
const JAPAN = record({
  code: 'JP',
  fr: 'Japon',
  en: 'Japan',
  currency: null,
  currencySymbol: null,
  phoneCode: null,
  flag: null,
});
const BRAZIL = record({ code: 'BR', fr: 'Brésil', en: 'Brazil' });

const names = () => [...document.querySelectorAll('.place-name')].map((el) => el.textContent);
const ready = () => screen.findByText(/pays — les modifications/);
const cardOf = (name: string) =>
  screen
    .getAllByText(name)
    .find((el) => el.className === 'place-name')!
    .closest('.place-card') as HTMLElement;

beforeEach(() => {
  mocks.fetchCountries.mockReset().mockResolvedValue([FRANCE, JAPAN, BRAZIL]);
  mocks.saveCountry.mockReset();
  mocks.saveContourDifficulty.mockReset();
  mocks.allContours.mockReset().mockReturnValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CountriesView loading', () => {
  it('shows a loading state, then the countries', async () => {
    render(<CountriesView />);
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    await ready();
    expect(names()).toContain('Japon');
    expect(screen.getByText(/3 pays — les modifications/)).toBeInTheDocument();
  });

  it('shows the failure to load', async () => {
    mocks.fetchCountries.mockRejectedValue(new Error('offline'));
    render(<CountriesView />);
    expect(await screen.findByText(/Impossible de charger les pays : offline/)).toBeInTheDocument();
  });
});

describe('CountriesView list', () => {
  it('sorts by French name, then by the chosen key and direction', async () => {
    render(<CountriesView />);
    await ready();
    expect(names()).toEqual(['Brésil', 'France', 'Japon']);

    await userEvent.click(screen.getByRole('button', { name: '▲ croissant' }));
    expect(names()).toEqual(['Japon', 'France', 'Brésil']);
    await userEvent.click(screen.getByRole('button', { name: '▼ décroissant' }));

    await userEvent.selectOptions(document.querySelector<HTMLSelectElement>('.panel select')!, 'code');
    expect(names()).toEqual(['Brésil', 'France', 'Japon']);
    await userEvent.selectOptions(document.querySelector<HTMLSelectElement>('.panel select')!, 'en');
    expect(names()).toEqual(['Brésil', 'France', 'Japon']);
  });

  it('filters by search text and says when nothing matches', async () => {
    render(<CountriesView />);
    await ready();
    await userEvent.type(screen.getByPlaceholderText('Nom ou code…'), 'jap');
    expect(names()).toEqual(['Japon']);
    expect(screen.getByText(/pays affiché sur 3/)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Nom ou code…'), 'zzz');
    expect(screen.getByText('Aucun pays ne correspond à cette recherche.')).toBeInTheDocument();
  });

  it('filters by continent and toggles it off', async () => {
    render(<CountriesView />);
    await ready();
    await userEvent.click(screen.getByRole('button', { name: 'Asie' }));
    expect(names()).toEqual(['Japon']);
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Asie' }));
    expect(names()).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Europe' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tous' }));
    expect(names()).toHaveLength(3);
  });

  it('paginates and goes back to the first page when the search changes', async () => {
    const many = Array.from({ length: 45 }, (_, i) =>
      record({ code: `X${String(i).padStart(2, '0')}`, fr: `Pays ${String(i).padStart(2, '0')}` }),
    );
    mocks.fetchCountries.mockResolvedValue(many);
    render(<CountriesView />);
    await ready();
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    expect(names()).toHaveLength(40);
    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    expect(names()).toHaveLength(5);
    await userEvent.type(screen.getByPlaceholderText('Nom ou code…'), 'Pays');
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
  });
});

describe('CountriesView neighbors', () => {
  it('lists the neighbors of a card and hides them again', async () => {
    render(<CountriesView />);
    await ready();
    const france = within(cardOf('France'));
    await userEvent.click(france.getByRole('button', { name: 'Afficher les voisins' }));
    expect(france.getByText('name-ES')).toBeInTheDocument();
    expect(france.getByText('name-DE')).toBeInTheDocument();
    await userEvent.click(france.getByRole('button', { name: 'Masquer les voisins' }));
    expect(france.queryByText('name-ES')).toBeNull();
  });

  it('says when a country has no land neighbor', async () => {
    render(<CountriesView />);
    await ready();
    await userEvent.click(within(cardOf('Japon')).getByRole('button', { name: 'Afficher les voisins' }));
    expect(screen.getByText('Aucun voisin terrestre.')).toBeInTheDocument();
  });
});

describe('CountriesView silhouette', () => {
  it('opens the silhouette editor of a country that has one, one at a time', async () => {
    mocks.allContours.mockReturnValue([{ code: 'FR' }, { code: 'BR' }]);
    render(<CountriesView />);
    await ready();
    expect(within(cardOf('Japon')).queryByRole('button', { name: /Silhouette/ })).toBeNull();

    await userEvent.click(within(cardOf('France')).getByRole('button', { name: /Silhouette/ }));
    expect(screen.getByText('contour editor FR alone')).toBeInTheDocument();
    await userEvent.click(within(cardOf('France')).getByRole('button', { name: 'Afficher les voisins' }));
    expect(screen.getByText('contour editor FR with neighbors')).toBeInTheDocument();

    await userEvent.click(within(cardOf('Brésil')).getByRole('button', { name: /Silhouette/ }));
    expect(screen.queryByText(/contour editor FR/)).toBeNull();
    expect(screen.getByText(/contour editor BR/)).toBeInTheDocument();

    await userEvent.click(within(cardOf('Brésil')).getByRole('button', { name: /Silhouette/ }));
    expect(screen.queryByText(/contour editor/)).toBeNull();
  });
});

describe('CountriesView editing', () => {
  const edit = async (card: HTMLElement, current: string, next: string) => {
    await userEvent.click(within(card).getByRole('button', { name: current }));
    const input = within(card).getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, `${next}{Enter}`);
  };

  it('saves an edited name, shows the saving flag then the saved one, then clears it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let resolve: (row: CountryRecord) => void = () => {};
    mocks.saveCountry.mockReturnValue(new Promise<CountryRecord>((r) => (resolve = r)));
    render(<CountriesView />);
    await ready();

    const card = cardOf('Japon');
    await edit(card, 'Japon', 'Nippon');
    expect(mocks.saveCountry).toHaveBeenCalledWith(JAPAN, { fr: 'Nippon' });
    await userEvent.click(within(card).getByRole('button', { name: 'Nippon' }));
    expect(within(card).getByText('…')).toBeInTheDocument();

    await act(async () => resolve({ ...JAPAN, fr: 'Nippon!' }));
    expect(within(card).getByText('✓')).toBeInTheDocument();
    expect(within(card).getByRole('textbox')).toHaveValue('Nippon');

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(within(card).queryByText('✓')).toBeNull();
  });

  it('puts the previous value back and flags the error when saving fails', async () => {
    mocks.saveCountry.mockRejectedValue(new Error('denied'));
    render(<CountriesView />);
    await ready();
    const card = cardOf('Japon');
    await edit(card, 'Japon', 'Nippon');
    await userEvent.click(within(card).getByRole('button', { name: 'Japon' }));
    expect(await within(card).findByTitle('denied')).toBeInTheDocument();
  });

  it.each([
    ['Nom (EN)', 'Brazil', 'en', 'Nihon'],
    ['Devise', 'Euro', 'currency', 'Dollar'],
    ['Symbole', '€', 'currencySymbol', '$'],
    ['Indicatif', '+33', 'phoneCode', '+1'],
  ])('saves the %s field', async (_label, current, field, next) => {
    mocks.saveCountry.mockResolvedValue(BRAZIL);
    render(<CountriesView />);
    await ready();
    const card = cardOf('Brésil');
    const row = within(card).getByText(_label).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: current }));
    const input = within(row).getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, `${next}{Enter}`);
    expect(mocks.saveCountry).toHaveBeenCalledWith(BRAZIL, { [field]: next });
  });

  it('shows empty optional fields as blank and an empty flag list', async () => {
    render(<CountriesView />);
    await ready();
    const card = within(cardOf('Japon'));
    expect(card.queryAllByRole('combobox')).toHaveLength(0);
    expect(card.queryAllByTitle('Retirer cette couleur')).toHaveLength(0);
  });

  it('saves the flag', async () => {
    mocks.saveCountry.mockResolvedValue(BRAZIL);
    render(<CountriesView />);
    await ready();
    const card = within(cardOf('Brésil'));
    await userEvent.click(card.getByRole('button', { name: '+ couleur' }));
    await userEvent.click(card.getByRole('button', { name: 'Enregistrer' }));
    expect(mocks.saveCountry).toHaveBeenCalledWith(BRAZIL, {
      flag: [
        ['blue', '#0000FF', 100],
        ['red', '#FF0000', 50],
      ],
    });
  });
});

describe('CountriesView difficulty', () => {
  const difficultySelect = (name: string) =>
    within(cardOf(name)).getByRole('combobox', { name: 'Difficulté Silhouette' });

  it('only offers a difficulty for a country with a silhouette', async () => {
    render(<CountriesView />);
    await ready();
    expect(difficultySelect('France')).toHaveValue('easy');
    expect(within(cardOf('Japon')).queryByRole('combobox', { name: 'Difficulté Silhouette' })).toBeNull();
  });

  it('saves a new difficulty and flags it', async () => {
    mocks.saveContourDifficulty.mockResolvedValue({ ...FRANCE, difficulty: 'hard' });
    render(<CountriesView />);
    await ready();
    await userEvent.selectOptions(difficultySelect('France'), 'hard');
    expect(mocks.saveContourDifficulty).toHaveBeenCalledWith(FRANCE, 'hard');
    expect(await within(cardOf('France')).findByText('✓')).toBeInTheDocument();
    expect(difficultySelect('France')).toHaveValue('hard');
  });

  it('shows the saving flag while writing', async () => {
    mocks.saveContourDifficulty.mockReturnValue(new Promise(() => {}));
    render(<CountriesView />);
    await ready();
    fireEvent.change(difficultySelect('France'), { target: { value: 'hard' } });
    expect(await within(cardOf('France')).findByText('…')).toBeInTheDocument();
  });

  it('goes back to the previous difficulty when saving fails', async () => {
    mocks.saveContourDifficulty.mockRejectedValue(new Error('denied'));
    render(<CountriesView />);
    await ready();
    await userEvent.selectOptions(difficultySelect('France'), 'hard');
    expect(await within(cardOf('France')).findByTitle('denied')).toBeInTheDocument();
    expect(difficultySelect('France')).toHaveValue('easy');
  });
});
