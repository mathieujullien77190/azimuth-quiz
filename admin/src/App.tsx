import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { Fragment, lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';

import appConfig from '../../app.json';
import { versionLabel } from '@/helpers/version';

import { AuthGate } from './components/AuthGate';
import { dataRevision, startJournalSync, subscribeRevision } from './data';
import { hrefOf, PAGES, pageFromPath, type PageId } from './pages';

// One chunk per page: a page's code is only downloaded when it is opened.
const PlacesView = lazy(() => import('./views/PlacesView').then((m) => ({ default: m.PlacesView })));
const CountriesView = lazy(() => import('./views/CountriesView').then((m) => ({ default: m.CountriesView })));
const JobsView = lazy(() => import('./views/JobsView').then((m) => ({ default: m.JobsView })));
const WordplayView = lazy(() => import('./views/WordplayView').then((m) => ({ default: m.WordplayView })));
const ErrorsView = lazy(() => import('./views/ErrorsView').then((m) => ({ default: m.ErrorsView })));

const AdminApp = () => {
  const [tab, setTab] = useState<PageId>(() => pageFromPath(window.location.pathname));
  // Back/forward move between the pages already visited.
  useEffect(() => {
    const onPopState = () => setTab(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    const label = PAGES.find((page) => page.id === tab)!.label;
    document.title = `Azimuth Quiz — Admin · ${label}`;
  }, [tab]);
  /** Changes page without reloading, and puts its URL in the address bar (`/admin/` stays as it is on the first page). */
  const goTo = (id: PageId) => {
    if (id === tab) return;
    window.history.pushState(null, '', hrefOf(id));
    setTab(id);
  };
  // Somebody else's change landed in the local copy: the views remount to show it.
  const revision = useSyncExternalStore(subscribeRevision, dataRevision);
  useEffect(() => startJournalSync(), []);
  // Same Chromium-on-Windows flag-emoji fallback as the game itself (see helpers/web.ts) —
  // needed here too since the flag badge below uses the same font/emoji.
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);

  return (
    <div className="wrap">
      <header className="top">
        <div className="top-inner">
          <h1>
            Admin{' '}
            <span className="dim">
              — Azimuth Quiz {versionLabel(appConfig.expo.version, appConfig.expo.extra.codename)}
            </span>
          </h1>
          <div className="tabs">
            {PAGES.map(({ id, label }) => (
              <a
                key={id}
                href={hrefOf(id)}
                className="chip game-chip"
                aria-pressed={tab === id}
                onClick={(event) => {
                  // Ctrl/Cmd/middle click keep the browser's own behaviour (a new tab on the page's real URL).
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  event.preventDefault();
                  goTo(id);
                }}
              >
                {label}
              </a>
            ))}
          </div>
          {/* Narrow screens: the chips collapse into one select (see `.tabs-select` in styles.css). */}
          <select
            className="field-select tabs-select"
            aria-label="Page"
            value={tab}
            onChange={(event) => goTo(event.target.value as PageId)}
          >
            {PAGES.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <Fragment key={revision}>
        <Suspense fallback={<div className="empty">Chargement…</div>}>
          {tab === 'places' && <PlacesView />}
          {tab === 'countries' && <CountriesView />}
          {tab === 'jobs' && <JobsView />}
          {tab === 'wordplay' && <WordplayView />}
          {tab === 'errors' && <ErrorsView />}
        </Suspense>
      </Fragment>
    </div>
  );
};

export const App = () => (
  <AuthGate>
    <AdminApp />
  </AuthGate>
);
