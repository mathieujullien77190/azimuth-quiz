import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeleteX } from './DeleteX';

describe('DeleteX', () => {
  it('deletes and re-enables the button', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<DeleteX name="Paris" onDelete={onDelete} />);
    const button = screen.getByTitle('Supprimer « Paris »');
    await userEvent.click(button);
    expect(onDelete).toHaveBeenCalledOnce();
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('×');
  });

  it('shows a pending state while deleting', async () => {
    let resolve: () => void = () => {};
    const onDelete = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<DeleteX name="Paris" onDelete={onDelete} />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('…');
    resolve();
    await vi.waitFor(() => expect(button).toBeEnabled());
  });

  it('shows the error when the deletion fails', async () => {
    render(<DeleteX name="Paris" onDelete={() => Promise.reject(new Error('nope'))} />);
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByTitle('nope')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
