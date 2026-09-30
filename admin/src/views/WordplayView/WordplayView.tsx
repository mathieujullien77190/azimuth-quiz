import { useMemo, useState } from 'react';

import { data } from '../../data';
import { saveWordplaySentence, wordplayEntryFor } from '../../api/wordplay';

type Row = { key: string; name: string; country: string; sentence: string };

/** Clues places of one category (`clues.category`), by name — the page lists French cities, then capitals. */
const rowsFor = (category: string): Row[] =>
  Object.entries(data().places)
    .filter(([, doc]) => doc.clues?.category === category)
    .map(([key, doc]) => ({
      key,
      name: doc.name,
      country: doc.country?.fr ?? doc.code,
      sentence: wordplayEntryFor({ key }).sentence,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

/** One place: its name, a text area for the pun, and the button that saves it. The button says "Ajouter" while
 * the place has no wordplay yet, "Modifier" once it has one; it is only enabled when the text changed. */
const WordplayLine = ({ row, onSaved }: { row: Row; onSaved: (key: string, sentence: string) => void }) => {
  const [draft, setDraft] = useState(row.sentence);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = draft.trim() !== row.sentence;

  const save = () => {
    setState('saving');
    saveWordplaySentence({ key: row.key, name: row.name, code: '' }, wordplayEntryFor({ key: row.key }), draft)
      .then((entry) => {
        onSaved(row.key, entry.sentence);
        setDraft(entry.sentence);
        setState('saved');
        setTimeout(() => setState('idle'), 1500);
      })
      .catch(() => setState('error'));
  };

  return (
    <tr>
      <td className="wordplay-name">
        <b>{row.name}</b>
        <span className="muted"> {row.country}</span>
      </td>
      <td>
        <textarea
          className="kv-input wordplay-input"
          placeholder="Jeu de mots sur le nom…"
          rows={4}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setState('idle');
          }}
        />
        <div className="wordplay-actions">
          {state === 'saved' && <span className="save-flag saved">✓</span>}
          {state === 'error' && (
            <span className="save-flag error" title="L’enregistrement a échoué">
              ⚠
            </span>
          )}
          <button className="reset" disabled={!dirty || state === 'saving'} type="button" onClick={save}>
            {state === 'saving' ? '…' : row.sentence === '' ? 'Ajouter' : 'Modifier'}
          </button>
        </div>
      </td>
    </tr>
  );
};

const Section = ({
  title,
  rows,
  onSaved,
}: {
  title: string;
  rows: Row[];
  onSaved: (key: string, sentence: string) => void;
}) => {
  const done = rows.filter((row) => row.sentence !== '').length;
  return (
    <>
      <h3 className="game-title">
        {title}{' '}
        <span className="muted">
          ({done} / {rows.length})
        </span>
      </h3>
      <table className="kv-table wordplay-table">
        <tbody>
          {rows.map((row) => (
            <WordplayLine key={`${row.key}:${row.sentence}`} onSaved={onSaved} row={row} />
          ))}
        </tbody>
      </table>
    </>
  );
};

/**
 * A page made for writing the wordplay clue: the French cities first, then the capitals, each with its name, a
 * text area and a button. Saving goes through `saveWordplaySentence` (Firestore, like the place cards' own
 * wordplay editor); an empty text removes the clue for that place.
 */
export const WordplayView = () => {
  const [frenchCities, setFrenchCities] = useState(() => rowsFor('citiesFr'));
  const [capitals, setCapitals] = useState(() => rowsFor('capital'));
  const [query, setQuery] = useState('');

  const saved = (key: string, sentence: string) => {
    const update = (rows: Row[]) => rows.map((row) => (row.key === key ? { ...row, sentence } : row));
    setFrenchCities(update);
    setCapitals(update);
  };

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const keep = (rows: Row[]) => (q === '' ? rows : rows.filter((row) => row.name.toLowerCase().includes(q)));
    return { frenchCities: keep(frenchCities), capitals: keep(capitals) };
  }, [frenchCities, capitals, q]);

  return (
    <>
      <div className="panel">
        <div className="row">
          <span className="field-label">Recherche</span>
          <input
            type="search"
            placeholder="Nom de la ville…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      <Section onSaved={saved} rows={visible.frenchCities} title="Villes françaises" />
      <Section onSaved={saved} rows={visible.capitals} title="Capitales" />
    </>
  );
};
