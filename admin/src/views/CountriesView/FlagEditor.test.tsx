import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ClueFlagColorRow } from '@/types';

import { FlagEditor } from './FlagEditor';

const value: ClueFlagColorRow[] = [
  ['blue', '#0000FF', 50],
  ['white', '#FFFFFF', 50],
];

describe('FlagEditor', () => {
  it('shows the rows and no save button while unchanged', () => {
    render(<FlagEditor value={value} saveFlag={<i>flag</i>} onSave={vi.fn()} />);
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.getByText('flag')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull();
  });

  it('saves edited color, hex and percent', async () => {
    const onSave = vi.fn();
    render(<FlagEditor value={value} saveFlag={null} onSave={onSave} />);
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'red');
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '#FF0000' } });
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '30' } });
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledWith([
      ['red', '#FF0000', 50],
      ['white', '#FFFFFF', 30],
    ]);
  });

  it('adds and removes a color', async () => {
    const onSave = vi.fn();
    render(<FlagEditor value={value} saveFlag={null} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: '+ couleur' }));
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
    await userEvent.click(screen.getAllByTitle('Retirer cette couleur')[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledWith([
      ['white', '#FFFFFF', 50],
      ['red', '#FF0000', 50],
    ]);
  });

  it('cancels the edits', async () => {
    render(<FlagEditor value={value} saveFlag={null} onSave={vi.fn()} />);
    await userEvent.click(screen.getAllByTitle('Retirer cette couleur')[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('follows a new value', () => {
    const { rerender } = render(<FlagEditor value={value} saveFlag={null} onSave={vi.fn()} />);
    rerender(<FlagEditor value={[['green', '#00FF00', 100]]} saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });
});
