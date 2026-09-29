import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { useEffect, useState } from 'react';

import appConfig from '../../app.json';

import { AuthGate } from './components/AuthGate';
import { lastSyncedAt, syncData } from './data';
import { CountriesView } from './views/CountriesView';
import { JobsView } from './views/JobsView';
import { PlacesView } from './views/PlacesView';
import { SyllablesView } from './views/SyllablesView';

type Tab = 'places' | 'countries' | 'syllables' | 'jobs';

const AdminApp = () => {
  const [tab, setTab] = useState<Tab>('places');
  const [syncing, setSyncing] = useState(false);
  const syncedLabel = lastSyncedAt() > 0 ? ` (${new Date(lastSyncedAt()).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})` : '';
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
            <button type="button" className="chip game-chip" aria-pressed={tab === 'places'} onClick={() => setTab('places')}>
              Lieux
            </button>
            <button type="button" className="chip game-chip" aria-pressed={tab === 'countries'} onClick={() => setTab('countries')}>
              Pays
            </button>
            <button type="button" className="chip game-chip" aria-pressed={tab === 'syllables'} onClick={() => setTab('syllables')}>
              Syllabes
            </button>
            <button type="button" className="chip game-chip" aria-pressed={tab === 'jobs'} onClick={() => setTab('jobs')}>
              Métiers
            </button>
          </div>
          <button
            className="reset"
            type="button"
            disabled={syncing}
            title="Relit tout Firestore (~2 700 lectures) et remplace la copie locale"
            onClick={() => {
              setSyncing(true);
              syncData()
                .then(() => window.location.reload())
                .catch(() => setSyncing(false));
            }}
          >
            {syncing ? 'Synchronisation…' : `🔄 Synchroniser${syncedLabel}`}
          </button>
        </div>
      </header>

      {tab === 'places' && <PlacesView />}
      {tab === 'countries' && <CountriesView />}
      {tab === 'syllables' && <SyllablesView />}
      {tab === 'jobs' && <JobsView />}
    </div>
  );
};

export const App = () => (
  <AuthGate>
    <AdminApp />
  </AuthGate>
);
