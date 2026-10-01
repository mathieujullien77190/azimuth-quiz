import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PAGE_SIZE, pageCount, paginate } from './helpers';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('goes to the previous and next pages', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onChange={onChange} />);
    expect(screen.getByText('Page 2 / 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Précédent/ }));
    expect(onChange).toHaveBeenLastCalledWith(1);
    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('disables the buttons at both ends', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Précédent/ })).toBeDisabled();
    rerender(<Pagination page={3} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Suivant/ })).toBeDisabled();
  });
});

describe('paginate and pageCount', () => {
  it('slices a page with the default and a custom size', () => {
    const items = Array.from({ length: PAGE_SIZE + 5 }, (_, i) => i);
    expect(paginate(items, 2)).toHaveLength(5);
    expect(paginate([1, 2, 3, 4], 2, 3)).toEqual([4]);
  });

  it('counts at least one page', () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(PAGE_SIZE + 1)).toBe(2);
    expect(pageCount(5, 2)).toBe(3);
  });
});
