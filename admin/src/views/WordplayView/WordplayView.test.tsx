import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Entry = { sentence: string; difficulty: string };

const mocks = vi.hoisted(() => ({
  places: {} as Record<string, unknown>,
  entries: {} as Record<string, Entry>,
  saveWordplayDifficulty: vi.fn(),
  saveWordplaySentence: vi.fn(),
}));

vi.mock('../../data', () => ({ data: () => ({ places: mocks.places }) }));
vi.mock('../../api/wordplay', () => ({
  wordplayEntryFor: (place: { key: string }) => mocks.entries[place.key] ?? { sentence: '', difficulty: 'intermediate' },
  saveWordplayDifficulty: mocks.saveWordplayDifficulty,
  saveWordplaySentence: mocks.saveWordplaySentence,
}));

import { WordplayView } from './WordplayView';

beforeEach(() => {
  mocks.places = {
    lyo: { name: 'Lyon', code: 'FR', country: { fr: 'France' }, clues: { category: 'citiesFr' } },
    aix: { name: 'Aix', code: 'FR', clues: { category: 'citiesFr' } },
    par: { name: 'Paris', code: 'FR', country: { fr: 'France' }, clues: { category: 'capital' } },
    oth: { name: 'Autre', code: 'FR', clues: { category: 'cities' } },
    nocl: { name: 'Sans', code: 'FR' },
  };
  mocks.entries = { par: { sentence: 'Pas riz', difficulty: 'hard' } };
  mocks.saveWordplayDifficulty.mockImplementation(async (_p: unknown, entry: object, difficulty: string) => ({ ...entry, difficulty }));
  mocks.saveWordplaySentence.mockImplementation(async (_p: unknown, entry: object, sentence: string) => ({
    ...entry,
    sentence: sentence.trim(),
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

const lineOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

describe('WordplayView', () => {
  it('lists French cities then capitals, sorted by name, with their progress', () => {
    render(<WordplayView />);
    expect(screen.getByText(/Villes françaises/)).toHaveTextContent('(0 / 2)');
    expect(screen.getByText('Capitales')).toHaveTextContent('(1 / 1)');
    const names = screen.getAllByRole('row').map((r) => r.querySelector('b')?.textContent);
    expect(names).toEqual(['Aix', 'Lyon', 'Paris']);
    expect(within(lineOf('Lyon')).getByText(/France/)).toBeInTheDocument();
    expect(within(lineOf('Aix')).getByText(/FR/)).toBeInTheDocument();
    expect(screen.queryByText('Autre')).not.toBeInTheDocument();
  });

  it('filters by name', async () => {
    const user = userEvent.setup();
    render(<WordplayView />);
    await user.type(screen.getByRole('searchbox'), ' LYO ');
    expect(screen.getByText('Lyon')).toBeInTheDocument();
    expect(screen.queryByText('Paris')).not.toBeInTheDocument();
  });

  it('labels the button "Ajouter" or "Modifier" and keeps it disabled until something changes', async () => {
    const user = userEvent.setup();
    render(<WordplayView />);
    const lyon = within(lineOf('Lyon'));
    expect(lyon.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
    expect(within(lineOf('Paris')).getByRole('button', { name: 'Modifier' })).toBeDisabled();
    await user.type(lyon.getByRole('textbox'), 'Lit on');
    expect(lyon.getByRole('button', { name: 'Ajouter' })).toBeEnabled();
  });

  it('saves a new sentence and updates the line and the progress', async () => {
    const user = userEvent.setup();
    render(<WordplayView />);
    await user.type(within(lineOf('Lyon')).getByRole('textbox'), 'Lit on ');
    await user.click(within(lineOf('Lyon')).getByRole('button', { name: 'Ajouter' }));
    expect(mocks.saveWordplayDifficulty).not.toHaveBeenCalled();
    expect(mocks.saveWordplaySentence).toHaveBeenCalledWith(
      { key: 'lyo', name: 'Lyon', code: '' },
      { sentence: '', difficulty: 'intermediate' },
      'Lit on ',
    );
    await vi.waitFor(() => expect(screen.getByText(/Villes françaises/)).toHaveTextContent('(1 / 2)'));
    const line = within(lineOf('Lyon'));
    expect(line.getByRole('textbox')).toHaveValue('Lit on');
    expect(line.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('shows a check that goes away when the saved values leave the row unchanged', async () => {
    mocks.saveWordplaySentence.mockImplementation(async (_p: unknown, entry: object) => entry);
    const user = userEvent.setup();
    render(<WordplayView />);
    await user.type(within(lineOf('Lyon')).getByRole('textbox'), 'x');
    await user.click(within(lineOf('Lyon')).getByRole('button', { name: 'Ajouter' }));
    expect(await within(lineOf('Lyon')).findByText('✓')).toBeInTheDocument();
    await vi.waitFor(() => expect(within(lineOf('Lyon')).queryByText('✓')).not.toBeInTheDocument(), { timeout: 2500 });
  });

  it('saves a changed difficulty alone', async () => {
    const user = userEvent.setup();
    render(<WordplayView />);
    await user.selectOptions(within(lineOf('Paris')).getByLabelText('Difficulté du jeu de mots'), 'easy');
    await user.click(within(lineOf('Paris')).getByRole('button', { name: 'Modifier' }));
    expect(mocks.saveWordplayDifficulty).toHaveBeenCalledTimes(1);
    expect(mocks.saveWordplaySentence).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(within(lineOf('Paris')).getByLabelText('Difficulté du jeu de mots')).toHaveValue('easy'));
    expect(within(lineOf('Paris')).getByRole('button', { name: 'Modifier' })).toBeDisabled();
  });

  it('saves both the difficulty and the sentence when both changed', async () => {
    const user = userEvent.setup();
    render(<WordplayView />);
    const paris = within(lineOf('Paris'));
    await user.selectOptions(paris.getByLabelText('Difficulté du jeu de mots'), 'easy');
    await user.clear(paris.getByRole('textbox'));
    await user.click(paris.getByRole('button', { name: 'Modifier' }));
    expect(mocks.saveWordplayDifficulty).toHaveBeenCalled();
    expect(mocks.saveWordplaySentence).toHaveBeenCalled();
    await vi.waitFor(() => expect(screen.getByText('Capitales')).toHaveTextContent('(0 / 1)'));
  });

  it('shows a warning when saving fails, and clears it when editing again', async () => {
    mocks.saveWordplaySentence.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<WordplayView />);
    await user.type(within(lineOf('Lyon')).getByRole('textbox'), 'x');
    await user.click(within(lineOf('Lyon')).getByRole('button', { name: 'Ajouter' }));
    expect(await within(lineOf('Lyon')).findByTitle('L’enregistrement a échoué')).toBeInTheDocument();
    await user.type(within(lineOf('Lyon')).getByRole('textbox'), 'y');
    expect(within(lineOf('Lyon')).queryByText('⚠')).not.toBeInTheDocument();
  });

  it('clears a previous warning when the difficulty changes', async () => {
    mocks.saveWordplaySentence.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<WordplayView />);
    await user.type(within(lineOf('Lyon')).getByRole('textbox'), 'x');
    await user.click(within(lineOf('Lyon')).getByRole('button', { name: 'Ajouter' }));
    await within(lineOf('Lyon')).findByText('⚠');
    await user.selectOptions(within(lineOf('Lyon')).getByLabelText('Difficulté du jeu de mots'), 'hard');
    expect(within(lineOf('Lyon')).queryByText('⚠')).not.toBeInTheDocument();
  });
});
