import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DescriptionCell } from './DescriptionCell';

describe('DescriptionCell', () => {
  it('shows the value, or a dash when empty', () => {
    const { rerender } = render(<DescriptionCell value="Hello" saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    rerender(<DescriptionCell value="" saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('saves the trimmed draft and collapses', async () => {
    const onSave = vi.fn();
    render(<DescriptionCell value="Hello" saveFlag={<i>flag</i>} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(screen.getByText('flag')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), ' world  ');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledWith('Hello world');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('discards the draft on cancel', async () => {
    const onSave = vi.fn();
    render(<DescriptionCell value="Hello" saveFlag={null} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    await userEvent.type(screen.getByRole('textbox'), 'xx');
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onSave).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(screen.getByRole('textbox')).toHaveValue('Hello');
  });

  it('follows a new value while collapsed', () => {
    const { rerender } = render(<DescriptionCell value="a" saveFlag={null} onSave={vi.fn()} />);
    rerender(<DescriptionCell value="b" saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getByText('b')).toBeInTheDocument();
  });
});
