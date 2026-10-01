import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CluePlace } from '@/types';

const mocks = vi.hoisted(() => ({
  charadeFor: vi.fn(),
  riddleFor: vi.fn(),
  saveCharadeRiddle: vi.fn(),
  saveCharadeSyllables: vi.fn(),
}));

vi.mock('../../api/charades', () => mocks);

import { CharadeEditor } from './CharadeEditor';

const place = { key: 'par', name: 'Paris', code: 'FR' } as CluePlace;
const RIDDLES: Record<string, string | null> = { pa: 'un papa', ris: null };

beforeEach(() => {
  mocks.charadeFor.mockReturnValue({ syllables: ['pa', 'ris'] });
  mocks.riddleFor.mockImplementation((s: string) => RIDDLES[s] ?? null);
  mocks.saveCharadeSyllables.mockImplementation(async (_p: CluePlace, next: string[]) => next);
  mocks.saveCharadeRiddle.mockImplementation(async (_s: string, next: string) => next);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('CharadeEditor', () => {
  it('shows each syllable with its riddle or a placeholder', () => {
    render(<CharadeEditor initialPlace={place} />);
    expect(screen.getByText('pa')).toBeInTheDocument();
    expect(screen.getByText('un papa')).toBeInTheDocument();
    expect(screen.getByText(/pas encore de charade/)).toBeInTheDocument();
    expect(screen.queryByText(/Aucune syllabe utilisable —/)).not.toBeInTheDocument();
  });

  it('tells there is no charade when the place has no syllable, and hides "Vider"', () => {
    mocks.charadeFor.mockReturnValue({ syllables: [] });
    render(<CharadeEditor initialPlace={place} />);
    expect(screen.getByText(/Aucune syllabe utilisable — pas de charade/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vider' })).not.toBeInTheDocument();
  });

  it('renames a syllable and flashes a check that disappears', async () => {
    const user = userEvent.setup();
    render(<CharadeEditor initialPlace={place} />);
    await user.click(screen.getByRole('button', { name: 'pa' }));
    const input = screen.getByDisplayValue('pa');
    await user.clear(input);
    await user.type(input, 'par{Enter}');
    expect(mocks.saveCharadeSyllables).toHaveBeenCalledWith(place, ['par', 'ris']);
    await user.click(await screen.findByRole('button', { name: 'par' }));
    expect(screen.getByText('✓')).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1600));
    });
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('removes a syllable with its cross', async () => {
    const user = userEvent.setup();
    render(<CharadeEditor initialPlace={place} />);
    await user.click(screen.getByTitle('Supprimer « la syllabe « ris » »'));
    expect(mocks.saveCharadeSyllables).toHaveBeenCalledWith(place, ['pa']);
    expect(await screen.findByText('un papa')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ris' })).not.toBeInTheDocument();
  });

  it('adds a syllable at the end', async () => {
    const user = userEvent.setup();
    render(<CharadeEditor initialPlace={place} />);
    await user.click(screen.getByRole('button', { name: '+ Ajouter une syllabe' }));
    await user.type(screen.getByRole('textbox'), 'xx{Enter}');
    expect(mocks.saveCharadeSyllables).toHaveBeenCalledWith(place, ['pa', 'ris', 'xx']);
    expect(await screen.findByRole('button', { name: 'xx' })).toBeInTheDocument();
  });

  it('clears every syllable with "Vider"', async () => {
    const user = userEvent.setup();
    render(<CharadeEditor initialPlace={place} />);
    await user.click(screen.getByRole('button', { name: 'Vider' }));
    expect(mocks.saveCharadeSyllables).toHaveBeenCalledWith(place, []);
    expect(await screen.findByText(/Aucune syllabe utilisable — pas de charade/)).toBeInTheDocument();
  });

  it('saves a riddle for its syllable and shows the saved text', async () => {
    const user = userEvent.setup();
    render(<CharadeEditor initialPlace={place} />);
    await user.click(screen.getByText(/pas encore de charade/));
    await user.type(screen.getByRole('textbox'), 'on en rit{Enter}');
    expect(mocks.saveCharadeRiddle).toHaveBeenCalledWith('ris', 'on en rit');
    await user.click(await screen.findByText('on en rit'));
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
