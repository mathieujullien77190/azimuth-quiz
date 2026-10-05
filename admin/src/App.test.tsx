import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  startJournalSync: vi.fn(),
  stopJournalSync: vi.fn(),
  polyfill: vi.fn(),
  revision: 0,
  notify: null as null | (() => void),
}));

vi.mock('country-flag-emoji-polyfill', () => ({ polyfillCountryFlagEmojis: mocks.polyfill }));
vi.mock('./components/AuthGate', () => ({
  AuthGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./data', () => ({
  startJournalSync: mocks.startJournalSync,
  dataRevision: () => mocks.revision,
  subscribeRevision: (cb: () => void) => {
    mocks.notify = cb;
    return () => {};
  },
}));
vi.mock('./views/PlacesView', () => ({ PlacesView: () => <div>places view</div> }));
vi.mock('./views/CountriesView', () => ({ CountriesView: () => <div>countries view</div> }));
vi.mock('./views/GlobeView', () => ({ GlobeView: () => <div>globe view</div> }));
vi.mock('./views/JobsView', () => ({ JobsView: () => <div>jobs view</div> }));
vi.mock('./views/WordplayView', () => ({ WordplayView: () => <div>wordplay view</div> }));
vi.mock('./views/ErrorsView', () => ({ ErrorsView: () => <div>errors view</div> }));
vi.mock('./views/FeedbackView', () => ({ FeedbackView: () => <div>feedback view</div> }));

import { App } from './App';
import { BASE_PATH, hrefOf, PAGES } from './pages';

const labelOf = (id: string) => PAGES.find((p) => p.id === id)!.label;

beforeEach(() => {
  mocks.revision = 0;
  mocks.startJournalSync.mockReturnValue(mocks.stopJournalSync);
  window.history.replaceState(null, '', `${BASE_PATH}/`);
});

describe('App', () => {
  it('opens the first page, starts the journal sync and the flag polyfill', async () => {
    render(<App />);
    expect(await screen.findByText('places view')).toBeInTheDocument();
    expect(mocks.startJournalSync).toHaveBeenCalledOnce();
    expect(mocks.polyfill).toHaveBeenCalledOnce();
    expect(document.title).toContain(labelOf('places'));
  });

  it('opens the page of the url', async () => {
    window.history.replaceState(null, '', hrefOf('errors'));
    render(<App />);
    expect(await screen.findByText('errors view')).toBeInTheDocument();
  });

  it('gives the Monde page the whole width, and the other pages the usual one', async () => {
    window.history.replaceState(null, '', hrefOf('globe'));
    const { container } = render(<App />);
    expect(await screen.findByText('globe view')).toBeInTheDocument();
    expect(container.querySelector('.wrap')).toHaveClass('wide');
  });

  it('keeps the usual width on the other pages', async () => {
    const { container } = render(<App />);
    await screen.findByText('places view');
    expect(container.querySelector('.wrap')).not.toHaveClass('wide');
  });

  it('switches page with a click and pushes the url', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    render(<App />);
    await screen.findByText('places view');
    await userEvent.click(screen.getByRole('link', { name: labelOf('jobs') }));
    expect(await screen.findByText('jobs view')).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith(null, '', hrefOf('jobs'));
    expect(screen.getByRole('link', { name: labelOf('jobs') })).toHaveAttribute('aria-pressed', 'true');
    expect(document.title).toContain(labelOf('jobs'));
  });

  it('does not push anything when clicking the current page', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    render(<App />);
    await screen.findByText('places view');
    await userEvent.click(screen.getByRole('link', { name: labelOf('places') }));
    expect(push).not.toHaveBeenCalled();
  });

  it('leaves modified clicks to the browser', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    render(<App />);
    await screen.findByText('places view');
    const link = screen.getByRole('link', { name: labelOf('jobs') });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link, { ctrlKey: true });
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByText('jobs view')).toBeNull();
  });

  it('switches page with the mobile select', async () => {
    render(<App />);
    await screen.findByText('places view');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Page' }), 'wordplay');
    expect(await screen.findByText('wordplay view')).toBeInTheDocument();
  });

  it('follows the back button', async () => {
    render(<App />);
    await screen.findByText('places view');
    window.history.replaceState(null, '', hrefOf('jobs'));
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(await screen.findByText('jobs view')).toBeInTheDocument();
  });

  it('remounts the views when the data revision changes', async () => {
    render(<App />);
    await screen.findByText('places view');
    mocks.revision = 1;
    await act(async () => mocks.notify?.());
    expect(await screen.findByText('places view')).toBeInTheDocument();
  });

  it('stops the journal sync on unmount', async () => {
    const { unmount } = render(<App />);
    await screen.findByText('places view');
    unmount();
    expect(mocks.stopJournalSync).toHaveBeenCalled();
  });

  it('shows every page', async () => {
    render(<App />);
    await screen.findByText('places view');
    for (const view of ['jobs', 'countries', 'wordplay', 'errors', 'feedback']) {
      await userEvent.click(screen.getByRole('link', { name: labelOf(view) }));
      expect(await screen.findByText(`${view} view`)).toBeInTheDocument();
    }
  });
});
