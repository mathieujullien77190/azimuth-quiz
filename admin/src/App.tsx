import { useState } from 'react';

import { CountriesView } from './views/CountriesView';
import { PlacesView } from './views/PlacesView';

type Tab = 'places' | 'countries';

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

      {tab === 'places' ? <PlacesView /> : <CountriesView />}
    </div>
  );
};
