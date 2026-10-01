import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CluePlace } from '@/types';

const mocks = vi.hoisted(() => ({
  saveWordplayDifficulty: vi.fn(),
  saveWordplaySentence: vi.fn(),
  wordplayEntryFor: vi.fn(),
}));

vi.mock('../../api/wordplay', () => mocks);

import { WordplayEditor } from './WordplayEditor';

const place = { key: 'par' } as CluePlace;

beforeEach(() => {
  mocks.wordplayEntryFor.mockReturnValue({ sentence: '', difficulty: 'intermediate' });
  mocks.saveWordplaySentence.mockImplementation(async (_p: unknown, entry: object, sentence: string) => ({ ...entry, sentence }));
  mocks.saveWordplayDifficulty.mockImplementation(async (_p: unknown, entry: object, difficulty: string) => ({ ...entry, difficulty }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('WordplayEditor', () => {
  it('shows a placeholder when no pun was curated, with the default difficulty', () => {
    render(<WordplayEditor initialPlace={place} />);
    expect(screen.getByText('(pas encore de jeu de mot)')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('intermediate');
  });

  it('saves the sentence, shows it and flashes a check that goes away', async () => {
    const user = userEvent.setup();
    render(<WordplayEditor initialPlace={place} />);
    await user.click(screen.getByText('(pas encore de jeu de mot)'));
    await user.type(screen.getByRole('textbox'), 'Paris sportif{Enter}');
    expect(mocks.saveWordplaySentence).toHaveBeenCalledWith(place, { sentence: '', difficulty: 'intermediate' }, 'Paris sportif');
    await user.click(await screen.findByText('Paris sportif'));
    expect(screen.getByText('✓')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByText('✓')).not.toBeInTheDocument(), { timeout: 2500 });
  });

  it('saves the difficulty chosen in the select', async () => {
    const user = userEvent.setup();
    render(<WordplayEditor initialPlace={place} />);
    await user.selectOptions(screen.getByRole('combobox'), 'hard');
    expect(mocks.saveWordplayDifficulty).toHaveBeenCalledWith(place, { sentence: '', difficulty: 'intermediate' }, 'hard');
    expect(await screen.findByText('✓')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('hard');
  });
});
