import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaceRow } from '../../api/places';

const mocks = vi.hoisted(() => ({
  fetchPlaces: vi.fn(),
  deletePlace: vi.fn(),
  saveCompass: vi.fn(),
  saveClues: vi.fn(),
  saveDifficulty: vi.fn(),
  canvas: null as null | import('./GlobeCanvas').GlobeCanvasProps,
}));

vi.mock('../../api/places', () => ({
  fetchPlaces: mocks.fetchPlaces,
  deletePlace: mocks.deletePlace,
  saveCompass: mocks.saveCompass,
  saveClues: mocks.saveClues,
  saveDifficulty: mocks.saveDifficulty,
}));
vi.mock('../PlacesView/WordplayEditor', () => ({ WordplayEditor: () => <div>wordplay-editor</div> }));
vi.mock('../PlacesView/PersonalityEditor', () => ({ PersonalityEditor: () => <div>personality-editor</div> }));
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
  country: 'France',
  coordinates: { latitude: 48.85, longitude: 2.35 },
  compass: { name: 'Paris', code: 'FR', category: 'capital', difficulty: 'easy', coordinates: { latitude: 48.85, longitude: 2.35 } },
  clues: null,
} as unknown as PlaceRow;
const KYOTO = {
  key: 'kyo',
  name: 'Kyoto',
  country: 'Japon',
  coordinates: { latitude: 35, longitude: 135.7 },
  compass: { name: 'Kyoto', code: 'JP', category: 'cities', difficulty: 'hard', coordinates: { latitude: 35, longitude: 135.7 } },
  clues: null,
} as unknown as PlaceRow;

const counts = () => document.querySelector('.count-line')!;
const ready = () => screen.findByText(/clic sur un point/);
const renderReady = async () => {
  render(<GlobeView />);
  await ready();
};
const act2 = (callback: () => void) => act(() => callback());

beforeEach(() => {
  mocks.canvas = null;
  mocks.fetchPlaces.mockReset().mockResolvedValue([PARIS, KYOTO]);
  mocks.deletePlace.mockReset().mockResolvedValue(undefined);
  mocks.saveDifficulty.mockReset();
});

describe('GlobeView loading', () => {
  it('shows a loading state, then the world', async () => {
    render(<GlobeView />);
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    await ready();
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(counts()).toHaveTextContent('2 lieux sur 2');
  });

  it('says so when the data cannot be read', async () => {
    mocks.fetchPlaces.mockRejectedValue(new Error('boom'));
    render(<GlobeView />);
    expect(await screen.findByText(/Impossible de charger le monde : boom/)).toBeInTheDocument();
  });
});

describe('GlobeView what is drawn', () => {
  it('draws every place, with its name', async () => {
    await renderReady();
    expect(canvas().placeKeys).toEqual(['par', 'kyo']);
    expect(canvas().placeNames).toEqual(['Paris', 'Kyoto']);
    expect(canvas().placeBuffers.positions).toHaveLength(6);
  });

  it('filters the places by category and by difficulty', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('button', { name: /Capitales/ }));
    expect(canvas().placeKeys).toEqual(['kyo']);
    await user.click(screen.getByRole('button', { name: 'Difficile' }));
    expect(canvas().placeKeys).toEqual([]);
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
  it('lists what matches (by name or country) and flies to it, opening its card', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.type(screen.getByPlaceholderText('Ville, lieu, pays…'), 'japon');
    await user.click(screen.getByRole('button', { name: '📍 Kyoto' }));
    expect(canvas().fly).toMatchObject({ lon: 135.7, lat: 35, token: 1 });
    expect(screen.getByPlaceholderText('Ville, lieu, pays…')).toHaveValue('');
    expect(screen.getByRole('complementary', { name: 'Détail' })).toBeInTheDocument();
    expect(screen.getByText('Kyoto')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Ville, lieu, pays…'), 'paris');
    await user.click(screen.getByRole('button', { name: '📍 Paris' }));
    expect(canvas().fly).toMatchObject({ lon: 2.35, lat: 48.85, token: 2 });
  });

  it('shows no list when nothing matches', async () => {
    const user = userEvent.setup();
    await renderReady();
    await user.type(screen.getByPlaceholderText('Ville, lieu, pays…'), 'zzzz');
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

  it('opens nothing for something that is not in the lists', async () => {
    await renderReady();
    act2(() => canvas().onSelect({ kind: 'place', id: 'nope' }));
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
    act2(() => canvas().onHover(null));
    expect(document.querySelector('.globe-label')).toBeNull();
    expect(canvas().hoveredMark).toBeNull();
  });

  it('names nothing for something unknown', async () => {
    await renderReady();
    act2(() => canvas().onHover({ kind: 'place', id: 'nope', x: 1, y: 1 }));
    expect(document.querySelector('.globe-label')).toBeNull();
    fireEvent.click(document.body);
  });
});
