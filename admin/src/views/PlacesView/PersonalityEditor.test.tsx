import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CluePlace } from '@/types';

const mocks = vi.hoisted(() => ({
  jobOptions: vi.fn(),
  personalityDraftFor: vi.fn(),
  savePersonalityJob: vi.fn(),
  savePersonalityName: vi.fn(),
}));

vi.mock('../../api/personality', () => mocks);

import { PersonalityEditor } from './PersonalityEditor';

const place = { key: 'par' } as CluePlace;

beforeEach(() => {
  mocks.jobOptions.mockReturnValue([
    { code: 'cha', fr: 'chanteuse' },
    { code: 'foo', fr: 'footballeur' },
  ]);
  mocks.personalityDraftFor.mockReturnValue({ name: '', jobCode: null });
  mocks.savePersonalityName.mockImplementation(async (_p: unknown, draft: object, name: string) => ({ ...draft, name }));
  mocks.savePersonalityJob.mockImplementation(async (_p: unknown, draft: object, jobCode: string | null) => ({ ...draft, jobCode }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PersonalityEditor', () => {
  it('shows a placeholder when there is no personality and offers the jobs', () => {
    render(<PersonalityEditor initialPlace={place} />);
    expect(screen.getByText('(pas encore de personnalité)')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByRole('option', { name: 'footballeur' })).toBeInTheDocument();
  });

  it('shows the curated name and job', () => {
    mocks.personalityDraftFor.mockReturnValue({ name: 'Zidane', jobCode: 'foo' });
    render(<PersonalityEditor initialPlace={place} />);
    expect(screen.getByText('Zidane')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('foo');
  });

  it('saves the name and flashes a check that goes away', async () => {
    const user = userEvent.setup();
    render(<PersonalityEditor initialPlace={place} />);
    await user.click(screen.getByText('(pas encore de personnalité)'));
    await user.type(screen.getByRole('textbox'), 'Edith{Enter}');
    expect(mocks.savePersonalityName).toHaveBeenCalledWith(place, { name: '', jobCode: null }, 'Edith');
    await user.click(await screen.findByText('Edith'));
    expect(screen.getByText('✓')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByText('✓')).not.toBeInTheDocument(), { timeout: 2500 });
  });

  it('saves the chosen job code', async () => {
    const user = userEvent.setup();
    render(<PersonalityEditor initialPlace={place} />);
    await user.selectOptions(screen.getByRole('combobox'), 'cha');
    expect(mocks.savePersonalityJob).toHaveBeenCalledWith(place, { name: '', jobCode: null }, 'cha');
    expect(await screen.findByText('✓')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('cha');
  });

  it('saves null when "(aucun)" is chosen', async () => {
    mocks.personalityDraftFor.mockReturnValue({ name: 'Zidane', jobCode: 'foo' });
    const user = userEvent.setup();
    render(<PersonalityEditor initialPlace={place} />);
    await user.selectOptions(screen.getByRole('combobox'), '(aucun)');
    expect(mocks.savePersonalityJob).toHaveBeenCalledWith(place, { name: 'Zidane', jobCode: 'foo' }, null);
  });
});
