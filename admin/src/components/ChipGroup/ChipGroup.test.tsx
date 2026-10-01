import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChipGroup } from './ChipGroup';
import { toggleInSet } from './helpers';

describe('ChipGroup', () => {
  const labels = { a: 'Alpha', b: 'Beta' };

  it('marks the active chips as pressed and reports the clicked key', async () => {
    const onToggle = vi.fn();
    render(<ChipGroup order={['a', 'b']} labels={labels} active={new Set(['a'])} onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onToggle).toHaveBeenCalledWith('b');
  });

  it('shows emojis and colors when given', () => {
    render(
      <ChipGroup
        order={['a', 'b']}
        labels={labels}
        active={new Set(['a'])}
        onToggle={vi.fn()}
        colors={{ a: 'red', b: '' }}
        emojis={{ a: '🔥', b: '' }}
      />,
    );
    const alpha = screen.getByRole('button', { name: /Alpha/ });
    expect(alpha).toHaveTextContent('🔥');
    expect(alpha.style.getPropertyValue('--tier-color')).toBe('red');
  });

  it('shows a dot when there is no emoji for the key', () => {
    const { container } = render(
      <ChipGroup
        order={['a']}
        labels={labels}
        active={new Set<'a'>()}
        onToggle={vi.fn()}
        emojis={{} as Record<'a', string>}
      />,
    );
    expect(container.querySelector('.dot')).toBeInTheDocument();
  });
});

describe('toggleInSet', () => {
  it('removes a key when others remain', () => {
    expect([...toggleInSet(new Set(['a', 'b']), 'a')]).toEqual(['b']);
  });

  it('keeps the last key', () => {
    const set = new Set(['a']);
    expect(toggleInSet(set, 'a')).toBe(set);
  });

  it('adds a missing key without mutating the input', () => {
    const set = new Set(['a']);
    expect([...toggleInSet(set, 'b')]).toEqual(['a', 'b']);
    expect(set.size).toBe(1);
  });
});
