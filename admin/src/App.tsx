import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { Fragment, useEffect, useState, useSyncExternalStore } from 'react';

import appConfig from '../../app.json';

import { AuthGate } from './components/AuthGate';
import { dataRevision, startJournalSync, subscribeRevision } from './data';
import { CountriesView } from './views/CountriesView';
import { JobsView } from './views/JobsView';
import { PlacesView } from './views/PlacesView';
import { SyllablesView } from './views/SyllablesView';
import { WordplayView } from './views/WordplayView';

type Tab = 'places' | 'countries' | 'syllables' | 'jobs' | 'wordplay';

const AdminApp = () => {
  const [tab, setTab] = useState<Tab>('places');
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
            Admin <span className="dim">— Azimuth Quiz v{appConfig.expo.version}</span>
          </h1>
          <div className="tabs">
            <button
              type="button"
              className="chip game-chip"
              aria-pressed={tab === 'places'}
              onClick={() => setTab('places')}
            >
              Lieux
            </button>
            <button
              type="button"
              className="chip game-chip"
              aria-pressed={tab === 'countries'}
              onClick={() => setTab('countries')}
            >
              Pays
            </button>
            <button
              type="button"
              className="chip game-chip"
              aria-pressed={tab === 'syllables'}
              onClick={() => setTab('syllables')}
            >
              Syllabes
            </button>
            <button
              type="button"
              className="chip game-chip"
              aria-pressed={tab === 'jobs'}
              onClick={() => setTab('jobs')}
            >
              Métiers
            </button>
            <button
              type="button"
              className="chip game-chip"
              aria-pressed={tab === 'wordplay'}
              onClick={() => setTab('wordplay')}
            >
              Jeux de mots
            </button>
          </div>
        </div>
      </header>

      <Fragment key={revision}>
        {tab === 'places' && <PlacesView />}
        {tab === 'countries' && <CountriesView />}
        {tab === 'syllables' && <SyllablesView />}
        {tab === 'jobs' && <JobsView />}
        {tab === 'wordplay' && <WordplayView />}
      </Fragment>
    </div>
  );
};

export const App = () => (
  <AuthGate>
    <AdminApp />
  </AuthGate>
);
