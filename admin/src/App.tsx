import { useState } from 'react';

import { clearChangelog, useChangelog } from './changelog';
import { CountriesView } from './views/CountriesView';
import { PlacesView } from './views/PlacesView';

type Tab = 'places' | 'countries';

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
        placeholder="Rien pour l'instant : modifie un lieu ou un pays, la ligne apparaît ici. Colle ce texte à Claude pour qu'il applique les changements — l'admin ne modifie jamais les fichiers directement (voir le README)."
      />
    </div>
  );
};

export const App = () => {
  const [tab, setTab] = useState<Tab>('places');

  return (
    <div className="wrap">
      <header className="top">
        <div className="top-inner">
          <h1>
            Admin <span className="dim">— Full Azimut</span>
          </h1>
          <div className="tabs">
            <button type="button" className="chip game-chip" aria-pressed={tab === 'places'} onClick={() => setTab('places')}>
              Lieux
            </button>
            <button type="button" className="chip game-chip" aria-pressed={tab === 'countries'} onClick={() => setTab('countries')}>
              Pays
            </button>
          </div>
        </div>
      </header>

      <ChangelogPanel />

      {tab === 'places' ? <PlacesView /> : <CountriesView />}
    </div>
  );
};
