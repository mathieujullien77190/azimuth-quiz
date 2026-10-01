import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SyllableRow } from './types';

const mocks = vi.hoisted(() => ({
  allSyllableRows: vi.fn(),
  deleteCharadeSyllable: vi.fn(),
  saveCharadeRiddle: vi.fn(),
}));

vi.mock('../../api/charades', () => ({
  deleteCharadeSyllable: mocks.deleteCharadeSyllable,
  saveCharadeRiddle: mocks.saveCharadeRiddle,
}));
vi.mock('./helpers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./helpers')>()),
  allSyllableRows: mocks.allSyllableRows,
}));

import { SyllablesView } from './SyllablesView';

const ROWS: SyllableRow[] = [
  { syllable: 'pa', riddle: 'un papa', examples: ['Paris', 'Palerme', 'Padoue', 'Pau', 'Pise', 'Pékin'] },
  { syllable: 'ro', riddle: null, examples: ['Rome'] },
];

beforeEach(() => {
  mocks.allSyllableRows.mockReturnValue(ROWS);
  mocks.saveCharadeRiddle.mockImplementation(async (_s: string, next: string) => next);
  mocks.deleteCharadeSyllable.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('SyllablesView', () => {
  it('lists every syllable with its riddle, placeholder and examples', () => {
    render(<SyllablesView />);
    expect(screen.getByText('un papa')).toBeInTheDocument();
    expect(screen.getByText(/pas encore de charade/)).toBeInTheDocument();
    expect(screen.getByText(/Paris, Palerme, Padoue, Pau/)).toBeInTheDocument();
    expect(screen.getByText(/2/, { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText(/syllabes affichées sur 2/)).toBeInTheDocument();
  });

  it('expands and collapses the examples beyond the visible ones', async () => {
    const user = userEvent.setup();
    render(<SyllablesView />);
    await user.click(screen.getByRole('button', { name: '+2 autres' }));
    expect(screen.getByText(/Pise, Pékin/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réduire' }));
    expect(screen.queryByText(/Pékin/)).not.toBeInTheDocument();
  });

  it('filters by query, resets the page, and shows a message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<SyllablesView />);
    await user.type(screen.getByRole('searchbox'), 'rome');
    expect(screen.queryByText('un papa')).not.toBeInTheDocument();
    expect(screen.getByText(/syllabe affichée sur 2/)).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('Aucune syllabe ne correspond à cette recherche.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByText('un papa')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
  });

  it('paginates long lists', async () => {
    mocks.allSyllableRows.mockReturnValue(
      Array.from({ length: 45 }, (_, i) => ({ syllable: `s${String(i).padStart(2, '0')}`, riddle: null, examples: [] })),
    );
    const user = userEvent.setup();
    render(<SyllablesView />);
    expect(screen.getByText('s00')).toBeInTheDocument();
    expect(screen.queryByText('s44')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suivant →' }));
    expect(screen.getByText('s44')).toBeInTheDocument();
  });

  it('saves a riddle, then flashes a check on that row only', async () => {
    const user = userEvent.setup();
    render(<SyllablesView />);
    await user.click(screen.getByText(/pas encore de charade/));
    await user.type(screen.getByRole('textbox'), 'un rot{Enter}');
    expect(mocks.saveCharadeRiddle).toHaveBeenCalledWith('ro', 'un rot');
    await user.click(await screen.findByText('un rot'));
    expect(screen.getByText('✓')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByText('✓')).not.toBeInTheDocument(), { timeout: 2500 });
  });

  it('deletes a syllable and removes its row', async () => {
    const user = userEvent.setup();
    render(<SyllablesView />);
    await user.click(screen.getByTitle('Supprimer « la syllabe « ro » (et dans 1 lieu) »'));
    expect(mocks.deleteCharadeSyllable).toHaveBeenCalledWith('ro');
    await vi.waitFor(() => expect(screen.queryByText(/pas encore de charade/)).not.toBeInTheDocument());
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByTitle('Supprimer « la syllabe « pa » (et dans 6 lieux) »')).toBeInTheDocument();
  });
});
