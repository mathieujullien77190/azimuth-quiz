import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Doc = { id: string; ref?: unknown; data: () => Record<string, unknown> };

const mocks = vi.hoisted(() => {
  const ts = (ms: number) => ({ ms, toMillis: () => ms });
  return {
    ts,
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    unsubscribe: vi.fn(),
    deleteDoc: vi.fn(),
    batchDelete: vi.fn(),
    batchCommit: vi.fn(),
    live: null as null | ((snap: unknown) => void),
  };
});

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  doc: (_db: unknown, ...path: string[]) => ({ path }),
  query: (...args: unknown[]) => ({ args }),
  orderBy: (...args: unknown[]) => ({ orderBy: args }),
  limit: (n: number) => ({ limit: n }),
  where: (...args: unknown[]) => ({ where: args }),
  getDocs: mocks.getDocs,
  onSnapshot: mocks.onSnapshot,
  deleteDoc: mocks.deleteDoc,
  writeBatch: () => ({ delete: mocks.batchDelete, commit: mocks.batchCommit }),
  Timestamp: { fromMillis: (ms: number) => mocks.ts(ms), now: () => mocks.ts(Date.now()) },
}));
vi.mock('../../firebase', () => ({ db: {} }));

import { ErrorsView } from './ErrorsView';

const errorDoc = (id: string, over: Record<string, unknown> = {}): Doc => ({
  id,
  ref: { id },
  data: () => ({
    action: `action-${id}`,
    code: 'permission-denied',
    message: `message-${id}`,
    room: 'ROOM1',
    kind: 'game',
    repeats: 2,
    platform: 'web',
    version: '2.0',
    at: mocks.ts(1000),
    expireAt: mocks.ts(5000),
    ...over,
  }),
});

beforeEach(() => {
  mocks.getDocs.mockReset();
  mocks.onSnapshot.mockReset().mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    mocks.live = cb;
    return mocks.unsubscribe;
  });
  mocks.deleteDoc.mockReset().mockResolvedValue(undefined);
  mocks.batchCommit.mockReset().mockResolvedValue(undefined);
});

const countLine = () => document.querySelector('.count-line')!.textContent!.split(' · ')[0];

describe('ErrorsView', () => {
  it('shows a loading state, then the errors', async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.getDocs.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ErrorsView />);
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    await act(async () =>
      resolve({
        docs: [errorDoc('1'), errorDoc('2', { room: undefined, repeats: undefined, kind: 'background', at: null })],
      }),
    );
    expect(countLine()).toBe('2 erreurs affichées');
    expect(screen.getByText(/message-1/)).toBeInTheDocument();
    expect(screen.getByText(/room ROOM1/)).toBeInTheDocument();
    expect(screen.getByText(/tâche de fond/)).toBeInTheDocument();
    expect(screen.getByText(/\+2 répétées/)).toBeInTheDocument();
  });

  it('shows the failure to load', async () => {
    mocks.getDocs.mockRejectedValue(new Error('offline'));
    render(<ErrorsView />);
    expect(await screen.findByText(/Impossible de charger les erreurs : offline/)).toBeInTheDocument();
  });

  it('shows an empty state and listens from the beginning of time', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    render(<ErrorsView />);
    expect(await screen.findByText('Aucune erreur enregistrée.')).toBeInTheDocument();
    expect(countLine()).toBe('0 erreurs affichées');
    expect(mocks.onSnapshot).toHaveBeenCalledOnce();
  });

  it('adds the errors that arrive live, newest first, ignoring other changes', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [errorDoc('1')] });
    render(<ErrorsView />);
    await screen.findByText(/message-1/);
    expect(countLine()).toBe('1 erreur affichée');
    await act(async () =>
      mocks.live?.({
        docChanges: () => [
          { type: 'added', doc: errorDoc('2') },
          { type: 'removed', doc: errorDoc('9') },
          { type: 'added', doc: errorDoc('3') },
        ],
      }),
    );
    const messages = screen.getAllByText(/message-\d/).map((el) => /message-\d/.exec(el.textContent ?? '')![0]);
    expect(messages).toEqual(['message-3', 'message-2', 'message-1']);
    expect(countLine()).toBe('3 erreurs affichées');
    await act(async () => mocks.live?.({ docChanges: () => [{ type: 'modified', doc: errorDoc('1') }] }));
    expect(countLine()).toBe('3 erreurs affichées');
  });

  it('stops listening on unmount', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    const { unmount } = render(<ErrorsView />);
    await screen.findByText('Aucune erreur enregistrée.');
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalled();
  });

  it('does nothing when unmounted before the first read ends', async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.getDocs.mockReturnValue(new Promise((r) => (resolve = r)));
    const { unmount } = render(<ErrorsView />);
    unmount();
    await act(async () => resolve({ docs: [] }));
    expect(mocks.onSnapshot).not.toHaveBeenCalled();
  });

  it('ignores a failure that comes after unmount', async () => {
    let reject: (error: Error) => void = () => {};
    mocks.getDocs.mockReturnValue(new Promise((_, r) => (reject = r)));
    const { unmount } = render(<ErrorsView />);
    unmount();
    await act(async () => reject(new Error('late')));
    expect(mocks.onSnapshot).not.toHaveBeenCalled();
  });

  it('deletes one error', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [errorDoc('1'), errorDoc('2')] });
    render(<ErrorsView />);
    await screen.findByText(/message-1/);
    await userEvent.click(screen.getAllByRole('button', { name: 'Supprimer' })[0]);
    expect(mocks.deleteDoc).toHaveBeenCalledWith({ path: ['errors', '1'] });
    expect(screen.queryByText(/message-1/)).toBeNull();
    expect(screen.getByText(/message-2/)).toBeInTheDocument();
  });

  it('removes the expired errors and shows the progress', async () => {
    mocks.getDocs.mockResolvedValueOnce({ docs: [errorDoc('1'), errorDoc('2')] });
    render(<ErrorsView />);
    await screen.findByText(/message-1/);
    let resolveCommit: () => void = () => {};
    mocks.batchCommit.mockReturnValue(new Promise<void>((r) => (resolveCommit = r)));
    mocks.getDocs.mockResolvedValueOnce({ docs: [errorDoc('1')] });
    await userEvent.click(screen.getByRole('button', { name: 'Effacer celles de plus de 30 jours' }));
    expect(await screen.findByRole('button', { name: 'Nettoyage…' })).toBeDisabled();
    await act(async () => resolveCommit());
    expect(mocks.batchDelete).toHaveBeenCalledWith({ id: '1' });
    expect(screen.queryByText(/message-1/)).toBeNull();
    expect(screen.getByText(/message-2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Effacer celles de plus de 30 jours' })).toBeEnabled();
  });

  it('re-enables the cleanup button when it fails', async () => {
    mocks.getDocs.mockResolvedValueOnce({ docs: [errorDoc('1')] });
    render(<ErrorsView />);
    await screen.findByText(/message-1/);
    mocks.getDocs.mockRejectedValueOnce(new Error('denied'));
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    await userEvent.click(screen.getByRole('button', { name: 'Effacer celles de plus de 30 jours' }));
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Effacer celles de plus de 30 jours' })).toBeEnabled(),
    );
    process.off('unhandledRejection', unhandled);
  });
});
