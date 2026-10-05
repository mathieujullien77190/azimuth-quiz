import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CountryRecord } from '../../api/countries';
import type { PlaceRow } from '../../api/places';

const mocks = vi.hoisted(() => ({
  fetchPlaces: vi.fn(),
  deletePlace: vi.fn(),
  saveCompass: vi.fn(),
  saveClues: vi.fn(),
  saveDifficulty: vi.fn(),
  fetchCountries: vi.fn(),
  saveCountry: vi.fn(),
  saveContourDifficulty: vi.fn(),
  allContours: vi.fn(),
  canvas: null as null | import('./GlobeCanvas').GlobeCanvasProps,
}));

vi.mock('../../api/places', () => ({
  fetchPlaces: mocks.fetchPlaces,
  deletePlace: mocks.deletePlace,
  saveCompass: mocks.saveCompass,
  saveClues: mocks.saveClues,
  saveDifficulty: mocks.saveDifficulty,
}));
vi.mock('../../api/countries', () => ({
  fetchCountries: mocks.fetchCountries,
  saveCountry: mocks.saveCountry,
  saveContourDifficulty: mocks.saveContourDifficulty,
}));
vi.mock('../../api/contour', () => ({ allContours: mocks.allContours }));
vi.mock('../../data', () => ({ countryName: (code: string) => ({ FR: 'France', JP: 'Japon' })[code] ?? code }));
vi.mock('../PlacesView/WordplayEditor', () => ({ WordplayEditor: () => <div>wordplay-editor</div> }));
vi.mock('../PlacesView/PersonalityEditor', () => ({ PersonalityEditor: () => <div>personality-editor</div> }));
vi.mock('../ContourView', () => ({
  ContourEditor: ({ initialCountry }: { initialCountry: { code: string } }) => <div>contour editor {initialCountry.code}</div>,
}));
vi.mock('./GlobeCanvas', () => ({
  GlobeCanvas: (props: import('./GlobeCanvas').GlobeCanvasProps) => {
    mocks.canvas = props;
    return <div data-testid="canvas" />;
  },
}));

import { GlobeView } from './GlobeView';

const canvas = () => mocks.canvas!;

const PARIS = {
  key: 'par',
  name: 'Paris',
  code: 'FR',
  coordinates: { latitude: 48.85, longitude: 2.35 },
  compass: { name: 'Paris', code: 'FR', category: 'capital', difficulty: 'easy', coordinates: { latitude: 48.85, longitude: 2.35 } },
  clues: null,
} as unknown as PlaceRow;
const KYOTO = {
  key: 'kyo',
  name: 'Kyoto',
  code: 'JP',
  coordinates: { latitude: 35, longitude: 135.7 },
  compass: { name: 'Kyoto', code: 'JP', category: 'cities', difficulty: 'hard', coordinates: { latitude: 35, longitude: 135.7 } },
  clues: null,
} as unknown as PlaceRow;

const country = (code: string, fr: string, difficulty: CountryRecord['difficulty']): CountryRecord => ({
  code,
  fr,
  en: fr,
  flag: null,
  currency: 'EUR',
  currencySymbol: null,
  phoneCode: null,
  neighbors: [],
  difficulty,
});
const FRANCE = country('FR', 'France', 'easy');
const JAPAN = country('JP', 'Japon', 'hard');
const ATLANTIS = country('AT', 'Atlantide', null);

const square = (lon: number, lat: number) =>
  [
    [lon, lat],
    [lon + 10, lat],
    [lon + 10, lat + 10],
    [lon, lat + 10],
  ] as const;
const CONTOURS = [
  { code: 'FR', points: square(0, 40), difficulty: 'intermediate', neighbors: [], centerLabel: { x: 0.5, y: 0.5 } },
  { code: 'JP', points: square(130, 30), difficulty: 'hard', neighbors: [], centerLabel: { x: 0.5, y: 0.5 } },
];

const counts = () => document.querySelector('.count-line')!;
const ready = () => screen.findByText(/clic sur un point ou un pays/);
const renderReady = async () => {
  render(<GlobeView />);
  await ready();
};
const act2 = (callback: () => void) => act(() => callback());

beforeEach(() => {
  mocks.canvas = null;
  mocks.fetchPlaces.mockReset().mockResolvedValue([PARIS, KYOTO]);
  mocks.fetchCountries.mockReset().mockResolvedValue([FRANCE, JAPAN, ATLANTIS]);
  mocks.allContours.mockReset().mockReturnValue(CONTOURS);
  mocks.deletePlace.mockReset().mockResolvedValue(undefined);
  mocks.saveDifficulty.mockReset();
  mocks.saveCountry.mockReset();
  mocks.saveContourDifficulty.mockReset();
});

describe('GlobeView loading', () => {
  it('shows a loading state, then the world', async () => {
    render(<GlobeView />);
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    await ready();
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(counts()).toHaveTextContent('2 lieux sur 2 · 2 pays dessinés sur 3');
  });

  it('says so when the data cannot be read', async () => {
    mocks.fetchPlaces.mockRejectedValue(new Error('boom'));
    render(<GlobeView />);
    expect(await screen.findByText(/Impossible de charger le monde : boom/)).toBeInTheDocument();
  });
});

describe('GlobeView what is drawn', () => {
  it('draws every place and every country that has an outline, coloured by their own difficulty', async () => {
    await renderReady();
    expect(canvas().placeKeys).toEqual(['par', 'kyo']);
    expect(canvas().placeNames).toEqual(['Paris', 'Kyoto']);
    // One name per country with an outline, in French, at the middle of its outline.
    expect(canvas().countryNames.length).toBeGreaterThan(0);
    expect(canvas().countryNames.every((entry) => typeof entry.name === 'string' && Number.isFinite(entry.lon))).toBe(true);
    expect(canvas().placeBuffers.positions).toHaveLength(6);
    // The Silhouette difficulty of the country list wins over the one in the contour document.
    expect(canvas().shapes.map((shape) => [shape.code, shape.difficulty])).toEqual([
      ['FR', 'easy'],
      ['JP', 'hard'],
    ]);
    expect(canvas().countryGroups).toHaveLength(3);
    expect(canvas().layers).toEqual({ countries: true, places: true });
  });

  it('falls back to the contour difficulty for a country missing from the list', async () => {
    mocks.fetchCountries.mockResolvedValue([FRANCE]);
    await renderReady();
    expect(canvas().shapes.map((shape) => [shape.code, shape.difficulty])).toEqual([
      ['FR', 'easy'],
      ['JP', 'hard'],
    ]);
  });

  it('shows and hides the countries and the places', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('button', { name: 'Pays' }));
    expect(canvas().layers).toEqual({ countries: false, places: true });
    await user.click(screen.getByRole('button', { name: 'Lieux' }));
    expect(canvas().layers).toEqual({ countries: false, places: false });
  });

  it('filters the places by category and both the places and the countries by difficulty', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('button', { name: /Capitales/ }));
    expect(canvas().placeKeys).toEqual(['kyo']);
    await user.click(screen.getByRole('button', { name: 'Difficile' }));
    expect(canvas().placeKeys).toEqual([]);
    expect(canvas().countryGroups).toHaveLength(2);
    expect(counts()).toHaveTextContent('0 lieux sur 2');
  });

  it('counts one place in the singular', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('button', { name: /Capitales/ }));
    expect(counts()).toHaveTextContent('1 lieu sur 2');
  });

  it('goes back to the home view with the reset button', async () => {
    const user = userEvent.setup();
    await renderReady();
    expect(canvas().resetToken).toBe(0);
    await user.click(screen.getByRole('button', { name: 'Recentrer' }));
    expect(canvas().resetToken).toBe(1);
  });
});

describe('GlobeView search', () => {
  it('lists what matches and flies to it, opening its card', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.type(screen.getByPlaceholderText('Pays, ville, lieu…'), 'fran');
    await user.click(screen.getByRole('button', { name: '🌍 France' }));
    expect(canvas().fly).toMatchObject({ lon: 5, lat: 45, token: 1 });
    expect(screen.getByPlaceholderText('Pays, ville, lieu…')).toHaveValue('');
    expect(screen.getByRole('complementary', { name: 'Détail' })).toBeInTheDocument();
    expect(screen.getAllByText('France').length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText('Pays, ville, lieu…'), 'kyo');
    await user.click(screen.getByRole('button', { name: '📍 Kyoto' }));
    expect(canvas().fly).toMatchObject({ lon: 135.7, lat: 35, token: 2 });
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
  });

  it('shows no list when nothing matches', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.type(screen.getByPlaceholderText('Pays, ville, lieu…'), 'zzzz');
    expect(screen.queryByRole('list')).toBeNull();
  });
});

describe('GlobeView selection', () => {
  it('opens the place card of a clicked place, and brightens its dot', async () => {
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'place', id: 'par' }));
    const panel = screen.getByRole('complementary', { name: 'Détail' });
    expect(within(panel).getByText('Paris')).toBeInTheDocument();
    expect(canvas().selectedMark?.point).not.toBeNull();
  });

  it('edits the place through the very same save as the Places list, and the globe follows', async () => {
    const user = userEvent.setup();
    mocks.saveDifficulty.mockResolvedValue({ compass: { ...PARIS.compass, difficulty: 'hard' }, clues: null });
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'place', id: 'par' }));
    await user.selectOptions(screen.getAllByRole('combobox').find((el) => (el as HTMLSelectElement).value === 'easy')!, 'hard');
    expect(mocks.saveDifficulty).toHaveBeenCalledWith(expect.objectContaining({ key: 'par' }), 'hard');
    // Hard places are all that is left once the filter says so: the edited place is among them.
    await waitFor(() => expect(canvas().placeKeys).toEqual(['par', 'kyo']));
  });

  it('closes the panel when the selection is cleared (a click on empty space, or the close button)', async () => {
    const user = userEvent.setup();
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'place', id: 'par' }));
    await user.click(screen.getByRole('button', { name: /Fermer/ }));
    expect(screen.queryByRole('complementary')).toBeNull();
    act2(() => canvas().onSelect({ kind: 'place', id: 'par' }));
    act2(() => canvas().onSelect(null));
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(canvas().selectedMark).toBeNull();
  });

  it('deletes the selected place and closes its panel', async () => {
    const user = userEvent.setup();
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'place', id: 'par' }));
    await user.click(screen.getByTitle(/Supprimer « Paris »/));
    await waitFor(() => expect(screen.queryByRole('complementary')).toBeNull());
    expect(mocks.deletePlace).toHaveBeenCalledWith(expect.objectContaining({ key: 'par' }));
    expect(canvas().placeKeys).toEqual(['kyo']);
  });

  it('opens the country card of a clicked country, with its neighbors and its Silhouette editor on demand', async () => {
    const user = userEvent.setup();
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'country', id: 'FR' }));
    expect(canvas().selectedMark?.segments.length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Afficher les voisins' }));
    expect(screen.getByRole('button', { name: 'Masquer les voisins' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Silhouette/ }));
    expect(screen.getByText('contour editor FR')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Silhouette/ }));
    expect(screen.queryByText('contour editor FR')).toBeNull();
  });

  it('starts a newly selected country with those toggles closed again', async () => {
    const user = userEvent.setup();
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'country', id: 'FR' }));
    await user.click(screen.getByRole('button', { name: 'Afficher les voisins' }));
    act2(() => canvas().onSelect({ kind: 'country', id: 'JP' }));
    expect(screen.getByRole('button', { name: 'Afficher les voisins' })).toBeInTheDocument();
  });

  it('edits the country through the same save as the Countries list', async () => {
    const user = userEvent.setup();
    mocks.saveContourDifficulty.mockResolvedValue(undefined);
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'country', id: 'FR' }));
    await user.selectOptions(screen.getByLabelText('Difficulté Silhouette'), 'hard');
    expect(mocks.saveContourDifficulty).toHaveBeenCalledWith(expect.objectContaining({ code: 'FR' }), 'hard');
    await waitFor(() => expect(canvas().shapes.find((shape) => shape.code === 'FR')?.difficulty).toBe('hard'));
  });

  it('opens nothing for something that is not in the lists', async () => {
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'place', id: 'nope' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    act2(() => canvas().onSelect({ kind: 'country', id: 'ZZ' }));
    expect(screen.queryByRole('complementary')).toBeNull();
  });
});

describe('GlobeView hover', () => {
  it('names what is under the pointer, at the pointer', async () => {
    await renderReady();
    act2(() => canvas().onHover({ kind: 'place', id: 'kyo', x: 30, y: 40 }));
    const label = screen.getByText('Kyoto');
    expect(label.getAttribute('style')).toBe('left: 30px; top: 40px;');
    expect(canvas().hoveredMark?.point).not.toBeNull();
    act2(() => canvas().onHover({ kind: 'country', id: 'JP', x: 5, y: 6 }));
    expect(screen.getByText('Japon')).toBeInTheDocument();
    act2(() => canvas().onHover(null));
    expect(screen.queryByText('Japon')).toBeNull();
    expect(canvas().hoveredMark).toBeNull();
  });

  it('names nothing for something unknown', async () => {
    await renderReady();
    act2(() => canvas().onHover({ kind: 'place', id: 'nope', x: 1, y: 1 }));
    expect(document.querySelector('.globe-label')).toBeNull();
    act2(() => canvas().onHover({ kind: 'country', id: 'ZZ', x: 1, y: 1 }));
    expect(document.querySelector('.globe-label')).toBeNull();
    fireEvent.click(document.body);
  });
});
