import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { Fragment, lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';

import { AppVersion } from './components/AppVersion';
import { AuthGate } from './components/AuthGate';
import { dataRevision, startJournalSync, subscribeRevision } from './data';
import { hrefOf, PAGES, pageFromPath, type PageId } from './pages';

// Un chunk par page : son code n'est telecharge qu'a l'ouverture.
const PlacesView = lazy(() => import('./views/PlacesView').then((m) => ({ default: m.PlacesView })));
const CountriesView = lazy(() => import('./views/CountriesView').then((m) => ({ default: m.CountriesView })));
const GlobeView = lazy(() => import('./views/GlobeView').then((m) => ({ default: m.GlobeView })));
const JobsView = lazy(() => import('./views/JobsView').then((m) => ({ default: m.JobsView })));
const WordplayView = lazy(() => import('./views/WordplayView').then((m) => ({ default: m.WordplayView })));
const ErrorsView = lazy(() => import('./views/ErrorsView').then((m) => ({ default: m.ErrorsView })));
const FeedbackView = lazy(() => import('./views/FeedbackView').then((m) => ({ default: m.FeedbackView })));

const AdminApp = () => {
  const [tab, setTab] = useState<PageId>(() => pageFromPath(window.location.pathname));
  useEffect(() => {
    const onPopState = () => setTab(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    const label = PAGES.find((page) => page.id === tab)!.label;
    document.title = `Azimuth Quiz — Admin · ${label}`;
  }, [tab]);
  /** Change de page sans recharger et met son URL dans la barre (`/admin/` reste tel quel sur la premiere). */
  const goTo = (id: PageId) => {
    if (id === tab) return;
    window.history.pushState(null, '', hrefOf(id));
    setTab(id);
  };
  // Un changement venu d'ailleurs est arrive dans la copie locale : les vues se remontent.
  const revision = useSyncExternalStore(subscribeRevision, dataRevision);
  useEffect(() => startJournalSync(), []);
  // Meme repli drapeau Chromium/Windows que le jeu (voir helpers/web.ts), pour le badge ci-dessous.
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);

  return (
    <div className={`wrap${tab === 'globe' ? ' wide' : ''}`}>
      <header className="top">
        <div className="top-inner">
          <h1>
            Admin{' '}
            <span className="dim">
              — Azimuth Quiz <AppVersion />
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
                  // Ctrl/Cmd/clic milieu gardent le comportement du navigateur (nouvel onglet).
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  event.preventDefault();
                  goTo(id);
                }}
              >
                {label}
              </a>
            ))}
          </div>
          {/* Etroit : les puces se replient en un select (voir `.tabs-select` dans styles.css). */}
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
          {tab === 'globe' && <GlobeView />}
          {tab === 'jobs' && <JobsView />}
          {tab === 'wordplay' && <WordplayView />}
          {tab === 'errors' && <ErrorsView />}
          {tab === 'feedback' && <FeedbackView />}
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
