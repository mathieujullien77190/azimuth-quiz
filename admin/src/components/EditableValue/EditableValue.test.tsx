import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EditableValue } from './EditableValue';

const open = async () => {
  await userEvent.click(screen.getByRole('button'));
  return screen.getByRole('textbox');
};

describe('EditableValue', () => {
  it('shows the display text, falling back to the value, then a dash', () => {
    const { rerender } = render(<EditableValue value="v" display="shown" saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('shown');
    rerender(<EditableValue value="v" saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('v');
    rerender(<EditableValue value={undefined as unknown as string} saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('—');
  });

  it('saves the trimmed text on Enter', async () => {
    const onSave = vi.fn();
    render(<EditableValue value="a" saveFlag={<i>flag</i>} onSave={onSave} />);
    const input = await open();
    expect(screen.getByText('flag')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, ' b {Enter}');
    expect(onSave).toHaveBeenCalledWith('b');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('does not save an unchanged or an empty value on blur', async () => {
    const onSave = vi.fn();
    render(<EditableValue value="a" saveFlag={null} onSave={onSave} />);
    await open();
    await userEvent.tab();
    expect(onSave).not.toHaveBeenCalled();
    const input = await open();
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves an empty value when allowed', async () => {
    const onSave = vi.fn();
    render(<EditableValue value="a" saveFlag={null} onSave={onSave} allowEmpty />);
    const input = await open();
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onSave).toHaveBeenCalledWith('');
  });

  it('cancels on Escape', async () => {
    const onSave = vi.fn();
    render(<EditableValue value="a" saveFlag={null} onSave={onSave} />);
    const input = await open();
    await userEvent.type(input, 'zz{Escape}');
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveTextContent('a');
  });

  it('follows a new value while not editing', () => {
    const { rerender } = render(<EditableValue value="a" saveFlag={null} onSave={vi.fn()} />);
    rerender(<EditableValue value="b" saveFlag={null} onSave={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('b');
  });

  describe('multiline', () => {
    it('saves on Enter without inserting a line break', async () => {
      const onSave = vi.fn();
      render(<EditableValue value="a" saveFlag={<i>flag</i>} onSave={onSave} multiline />);
      const area = await open();
      expect(screen.getByText('flag')).toBeInTheDocument();
      await userEvent.type(area, 'b{Enter}');
      expect(onSave).toHaveBeenCalledWith('ab');
    });

    it('cancels on Escape and ignores other keys', async () => {
      const onSave = vi.fn();
      render(<EditableValue value="a" saveFlag={null} onSave={onSave} multiline />);
      const area = await open();
      await userEvent.type(area, 'zz{Escape}');
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByRole('button')).toHaveTextContent('a');
    });
  });
});
