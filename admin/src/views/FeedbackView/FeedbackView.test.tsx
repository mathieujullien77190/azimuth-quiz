import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Doc = { id: string; data: () => Record<string, unknown> };

const mocks = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  getDocs: vi.fn(),
  batchDelete: vi.fn(),
  batchCommit: vi.fn(),
  unsubscribe: vi.fn(),
  live: null as null | ((snap: { docs: Doc[] }) => void),
  fail: null as null | ((error: Error) => void),
}));

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  doc: (_db: unknown, ...path: string[]) => ({ path }),
  query: (...args: unknown[]) => ({ args }),
  orderBy: (...args: unknown[]) => ({ orderBy: args }),
  limit: (n: number) => ({ limit: n }),
  getDocs: mocks.getDocs,
  onSnapshot: mocks.onSnapshot,
  writeBatch: () => ({ delete: mocks.batchDelete, commit: mocks.batchCommit }),
}));
vi.mock('../../firebase', () => ({ db: {} }));

import { FeedbackView } from './FeedbackView';

const ts = (ms: number) => ({ toMillis: () => ms });
const feedbackDoc = (id: string, over: Record<string, unknown> = {}): Doc => ({
  id,
  data: () => ({
    game: 'compass',
    targetKey: 'vic',
    name: 'Chutes Victoria',
    currentDifficulty: 'intermediate',
    suggestedDifficulty: 'hard',
    at: ts(1000),
    ...over,
  }),
});

const emit = (docs: Doc[]) => act(async () => mocks.live!({ docs }));
const textbox = () => screen.getByRole('textbox', { name: 'Avis de difficulté' }) as HTMLTextAreaElement;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.live = null;
  mocks.fail = null;
  mocks.onSnapshot.mockImplementation(
    (_q: unknown, next: (snap: { docs: Doc[] }) => void, error: (e: Error) => void) => {
      mocks.live = next;
      mocks.fail = error;
      return mocks.unsubscribe;
    },
  );
  mocks.batchCommit.mockResolvedValue(undefined);
});

describe('FeedbackView', () => {
  it('waits for the first read, then shows the opinions as text, live', async () => {
    render(<FeedbackView />);
    expect(screen.getByText('Chargement…')).toBeInTheDocument();

    await emit([feedbackDoc('a'), feedbackDoc('b')]);
    expect(textbox().value).toContain('Change la difficulté du lieu « Chutes Victoria » (vic) de intermediate à hard');
    expect(screen.getByText('2').closest('p')).toHaveTextContent('2 avis');

    await emit([feedbackDoc('a')]);
    expect(textbox().value).toContain('(1 vote');
  });

  it('shows nothing to say, and nothing to clean, without opinions', async () => {
    render(<FeedbackView />);
    await emit([]);
    expect(textbox().value).toBe('Aucun avis pour le moment.');
    expect(screen.getByRole('button', { name: 'Nettoyer' })).toBeDisabled();
  });

  it('reads an opinion without a server time yet as just now', async () => {
    render(<FeedbackView />);
    await emit([feedbackDoc('a', { at: null })]);
    expect(textbox().value).toContain('vic');
  });

  it('says when the opinions cannot be read, and stops listening on the way out', async () => {
    const { unmount } = render(<FeedbackView />);
    await act(async () => mocks.fail!(new Error('permission-denied')));
    expect(screen.getByText(/Impossible de charger les avis : permission-denied/)).toBeInTheDocument();
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalled();
  });

  it('copies the text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<FeedbackView />);
    await emit([feedbackDoc('a')]);
    await userEvent.click(screen.getByRole('button', { name: 'Copier' }));
    expect(writeText).toHaveBeenCalledWith(textbox().value);
    expect(await screen.findByRole('button', { name: 'Copié' })).toBeInTheDocument();
  });

  it('asks twice before cleaning, and can be cancelled', async () => {
    render(<FeedbackView />);
    await emit([feedbackDoc('a')]);
    await userEvent.click(screen.getByRole('button', { name: 'Nettoyer' }));
    expect(screen.getByRole('button', { name: 'Confirmer (supprime 1)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Nettoyer' })).toBeInTheDocument();
    expect(mocks.batchCommit).not.toHaveBeenCalled();
  });

  it('deletes every opinion, a batch at a time, until none is left', async () => {
    mocks.getDocs
      .mockResolvedValueOnce({ empty: false, docs: [feedbackDoc('a'), feedbackDoc('b')] })
      .mockResolvedValueOnce({ empty: false, docs: [feedbackDoc('c')] })
      .mockResolvedValueOnce({ empty: true, docs: [] });
    render(<FeedbackView />);
    await emit([feedbackDoc('a'), feedbackDoc('b'), feedbackDoc('c')]);
    await userEvent.click(screen.getByRole('button', { name: 'Nettoyer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer (supprime 3)' }));

    expect(mocks.batchDelete).toHaveBeenCalledTimes(3);
    expect(mocks.batchCommit).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('button', { name: 'Nettoyer' })).toBeInTheDocument();
  });

  it('comes back from a failed cleaning to the normal buttons', async () => {
    mocks.getDocs.mockRejectedValueOnce(new Error('boom'));
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    render(<FeedbackView />);
    await emit([feedbackDoc('a')]);
    await userEvent.click(screen.getByRole('button', { name: 'Nettoyer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer (supprime 1)' }));
    expect(await screen.findByRole('button', { name: 'Nettoyer' })).toBeInTheDocument();
    process.off('unhandledRejection', unhandled);
  });
});
