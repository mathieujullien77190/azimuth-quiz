import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { useEffect, useState } from 'react';

import appConfig from '../../app.json';

import { AuthGate } from './components/AuthGate';
import { clearChangelog, useChangelog } from './changelog';
import { CountriesView } from './views/CountriesView';
import { JobsView } from './views/JobsView';
import { PlacesView } from './views/PlacesView';
import { SyllablesView } from './views/SyllablesView';

type Tab = 'places' | 'countries' | 'syllables' | 'jobs';

const ChangelogPanel = () => {
  const lines = useChangelog();
  const [copied, setCopied] = useState(false);

  const text = lines.join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. no HTTPS): the textarea below can still be selected by hand.
    }
  };

  return (
    <div className="changelog">
      <div className="changelog-header">
        <span className="field-label">
          Journal des modifications {lines.length > 0 && <b>({lines.length})</b>}
        </span>
        <div className="changelog-actions">
          <button className="reset" type="button" onClick={copy} disabled={lines.length === 0}>
            {copied ? '✓ Copié' : 'Copier'}
          </button>
          <button className="reset" type="button" onClick={clearChangelog} disabled={lines.length === 0}>
            Vider
          </button>
        </div>
      </div>
      <textarea
        className="changelog-textarea"
        readOnly
        value={text}
        placeholder="Rien pour l'instant : chaque modification est enregistrée dans Firestore et une ligne s'ajoute ici (simple trace de session)."
      />
    </div>
  );
};

const AdminApp = () => {
  const [tab, setTab] = useState<Tab>('places');
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
        </div>
      </header>

      <ChangelogPanel />

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
