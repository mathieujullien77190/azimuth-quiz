import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobRow } from '../../api/personality';

const mocks = vi.hoisted(() => ({
  addJob: vi.fn(),
  allJobRows: vi.fn(),
  deleteJob: vi.fn(),
  filterJobRows: vi.fn(),
  saveJobEn: vi.fn(),
  saveJobFr: vi.fn(),
}));

vi.mock('../../api/personality', () => mocks);

import { JobsView } from './JobsView';

const ROWS: JobRow[] = [
  { code: 'cha', fr: 'chanteuse', en: 'singer', examples: ['Edith'] },
  { code: 'foo', fr: 'footballeur', en: 'footballer', examples: [] },
];

beforeEach(() => {
  mocks.allJobRows.mockReturnValue(ROWS);
  mocks.filterJobRows.mockImplementation((rows: JobRow[], q: string) => rows.filter((r) => r.fr.includes(q)));
  mocks.saveJobFr.mockImplementation(async (job: JobRow, fr: string) => ({ ...job, fr }));
  mocks.saveJobEn.mockImplementation(async (job: JobRow, en: string) => ({ ...job, en }));
  mocks.deleteJob.mockResolvedValue(undefined);
  mocks.addJob.mockImplementation(async (fr: string, en: string) => ({ code: 'acr', fr, en, examples: [] }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('JobsView', () => {
  it('lists jobs and offers delete only for unused ones', () => {
    render(<JobsView />);
    expect(screen.getByText('chanteuse')).toBeInTheDocument();
    expect(screen.getByText('footballer')).toBeInTheDocument();
    expect(screen.queryByTitle('Supprimer « le métier « chanteuse » »')).not.toBeInTheDocument();
    expect(screen.getByTitle('Supprimer « le métier « footballeur » »')).toBeInTheDocument();
    expect(screen.getByText(/métiers affichés sur 2/)).toBeInTheDocument();
  });

  it('filters, uses the singular for one result and resets the query', async () => {
    const user = userEvent.setup();
    render(<JobsView />);
    await user.type(screen.getByRole('searchbox'), 'foot');
    expect(screen.queryByText('chanteuse')).not.toBeInTheDocument();
    expect(screen.getByText(/métier affiché sur 2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(screen.getByText('chanteuse')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
  });

  it('paginates long lists', async () => {
    mocks.allJobRows.mockReturnValue(
      Array.from({ length: 45 }, (_, i) => ({ code: `j${i}`, fr: `m${String(i).padStart(2, '0')}`, en: `e${i}`, examples: ['x'] })),
    );
    const user = userEvent.setup();
    render(<JobsView />);
    expect(screen.queryByText('m44')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suivant →' }));
    expect(screen.getByText('m44')).toBeInTheDocument();
  });

  it('renames the French text and flashes a check', async () => {
    const user = userEvent.setup();
    render(<JobsView />);
    await user.click(screen.getByText('chanteuse'));
    await user.keyboard('diva{Enter}');
    expect(mocks.saveJobFr).toHaveBeenCalledWith(ROWS[0], 'diva');
    await user.click(await screen.findByText('diva'));
    expect(screen.getByText('✓')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByText('✓')).not.toBeInTheDocument(), { timeout: 2500 });
  });

  it('renames the English text and only flags that field', async () => {
    const user = userEvent.setup();
    render(<JobsView />);
    await user.click(screen.getByText('singer'));
    await user.keyboard('vocalist{Enter}');
    expect(mocks.saveJobEn).toHaveBeenCalledWith(ROWS[0], 'vocalist');
    await user.click(await screen.findByText('vocalist'));
    expect(screen.getByText('✓')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByText('chanteuse'));
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('deletes an unused job', async () => {
    const user = userEvent.setup();
    render(<JobsView />);
    await user.click(screen.getByTitle('Supprimer « le métier « footballeur » »'));
    expect(mocks.deleteJob).toHaveBeenCalledWith(ROWS[1]);
    await vi.waitFor(() => expect(screen.queryByText('footballeur')).not.toBeInTheDocument());
  });

  it('adds a job once both texts are filled, keeping the list sorted by French text', async () => {
    const user = userEvent.setup();
    render(<JobsView />);
    const add = screen.getByRole('button', { name: '+ Ajouter un métier' });
    expect(add).toBeDisabled();
    await user.type(screen.getByPlaceholderText('Français'), '  acrobate ');
    expect(add).toBeDisabled();
    await user.type(screen.getByPlaceholderText('Anglais'), ' acrobat ');
    await user.click(add);
    expect(mocks.addJob).toHaveBeenCalledWith('acrobate', 'acrobat');
    await screen.findByText('acrobate');
    expect(screen.getByPlaceholderText('Français')).toHaveValue('');
    expect(screen.getByPlaceholderText('Anglais')).toHaveValue('');
    const firstDataRow = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(firstDataRow).toHaveTextContent('acrobate');
  });

  it('does not add a job from a blank submission', async () => {
    const user = userEvent.setup();
    render(<JobsView />);
    await user.type(screen.getByPlaceholderText('Français'), '   ');
    await user.type(screen.getByPlaceholderText('Anglais'), 'x');
    expect(screen.getByRole('button', { name: '+ Ajouter un métier' })).toBeDisabled();
    expect(mocks.addJob).not.toHaveBeenCalled();
  });
});
