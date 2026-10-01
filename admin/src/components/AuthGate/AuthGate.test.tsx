import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listener: null as null | ((user: unknown) => void),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  loadData: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  onAuthStateChanged: (_auth: unknown, cb: (user: unknown) => void) => {
    mocks.listener = cb;
    return () => {};
  },
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
}));
vi.mock('../../firebase', () => ({ auth: { id: 'auth' }, ADMIN_EMAILS: ['admin@x.com'] }));
vi.mock('../../data', () => ({ loadData: mocks.loadData }));

import { AuthGate } from './AuthGate';

const setUser = (user: unknown) => act(async () => mocks.listener?.(user));

beforeEach(() => {
  mocks.loadData.mockReset().mockResolvedValue(undefined);
  mocks.signInWithPopup.mockReset().mockResolvedValue(undefined);
});

describe('AuthGate', () => {
  it('waits for the auth state', () => {
    render(<AuthGate>content</AuthGate>);
    expect(screen.getByText('Connexion…')).toBeInTheDocument();
  });

  it('offers to sign in when signed out, and shows a popup failure', async () => {
    render(<AuthGate>content</AuthGate>);
    await setUser(null);
    mocks.signInWithPopup.mockRejectedValueOnce(new Error('popup closed'));
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter avec Google' }));
    expect(await screen.findByText('popup closed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Se déconnecter' })).toBeNull();
  });

  it('refuses another account and can sign out', async () => {
    render(<AuthGate>content</AuthGate>);
    await setUser({ email: 'other@x.com' });
    expect(screen.getByText(/other@x.com/)).toBeInTheDocument();
    expect(mocks.loadData).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it('treats a user without email as signed out', async () => {
    render(<AuthGate>content</AuthGate>);
    await setUser({ email: null });
    expect(screen.getByRole('button', { name: 'Se connecter avec Google' })).toBeInTheDocument();
  });

  it('loads the data for an admin, then renders the children', async () => {
    let resolve: () => void = () => {};
    mocks.loadData.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    render(<AuthGate>content</AuthGate>);
    await setUser({ email: 'admin@x.com' });
    expect(screen.getByText('Chargement des données…')).toBeInTheDocument();
    await act(async () => resolve());
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('shows the load error and retries', async () => {
    mocks.loadData.mockRejectedValueOnce(new Error('boom'));
    render(<AuthGate>content</AuthGate>);
    await setUser({ email: 'admin@x.com' });
    expect(await screen.findByText('boom')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('content')).toBeInTheDocument();
  });
});
