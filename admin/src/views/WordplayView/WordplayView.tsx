import { useMemo, useState } from 'react';

import { data } from '../../data';
import { saveWordplayDifficulty, saveWordplaySentence, wordplayEntryFor } from '../../api/wordplay';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../../constants';
import type { Difficulty } from '@/types';

type Row = { key: string; name: string; country: string; sentence: string; difficulty: Difficulty };

/**
 * Lieux Indices d'une categorie (`clues.category`), par nom : la page liste les villes francaises, puis les
 * capitales.
 */
const rowsFor = (category: string): Row[] =>
  Object.entries(data().places)
    .filter(([, doc]) => doc.clues?.category === category)
    .map(([key, doc]) => ({
      key,
      name: doc.name,
      country: doc.country?.fr ?? doc.code,
      sentence: wordplayEntryFor({ key }).sentence,
      difficulty: wordplayEntryFor({ key }).difficulty,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

/**
 * Un lieu : nom, zone de texte du jeu de mots, difficulte et bouton qui sauve les deux ("Ajouter" sans jeu de mots,
 * "Modifier" sinon ; actif seulement si le texte ou la difficulte a change).
 */
const WordplayLine = ({
  row,
  onSaved,
}: {
  row: Row;
  onSaved: (key: string, sentence: string, difficulty: Difficulty) => void;
}) => {
  const [draft, setDraft] = useState(row.sentence);
  const [difficulty, setDifficulty] = useState<Difficulty>(row.difficulty);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = draft.trim() !== row.sentence || difficulty !== row.difficulty;

  const save = async () => {
    setState('saving');
    try {
      const place = { key: row.key, name: row.name, code: '' };
      let entry = wordplayEntryFor({ key: row.key });
      if (difficulty !== entry.difficulty) entry = await saveWordplayDifficulty(place, entry, difficulty);
      if (draft.trim() !== entry.sentence) entry = await saveWordplaySentence(place, entry, draft);
      onSaved(row.key, entry.sentence, entry.difficulty);
      setDraft(entry.sentence);
      setDifficulty(entry.difficulty);
      setState('saved');
      setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('error');
    }
  };

  return (
    <tr>
      <td className="wordplay-name">
        <b>{row.name}</b>
        <span className="muted"> · {row.country}</span>
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
          <select
            aria-label="Difficulté du jeu de mots"
            className="field-select"
            style={{ '--tier-color': DIFFICULTY_COLORS[difficulty] } as React.CSSProperties}
            value={difficulty}
            onChange={(event) => {
              setDifficulty(event.target.value as Difficulty);
              setState('idle');
            }}
          >
            {DIFFICULTY_ORDER.map((tier) => (
              <option key={tier} value={tier}>
                {DIFFICULTY_LABELS[tier]}
              </option>
            ))}
          </select>
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
  onSaved: (key: string, sentence: string, difficulty: Difficulty) => void;
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
            <WordplayLine key={`${row.key}:${row.sentence}:${row.difficulty}`} onSaved={onSaved} row={row} />
          ))}
        </tbody>
      </table>
    </>
  );
};

/**
 * Page d'ecriture du jeu de mots : villes francaises d'abord, puis capitales, chacune avec nom, zone de texte et
 * bouton. Sauve via `saveWordplaySentence` (Firestore, comme l'editeur des cartes lieu) ; un texte vide retire
 * l'indice.
 */
export const WordplayView = () => {
  const [frenchCities, setFrenchCities] = useState(() => rowsFor('citiesFr'));
  const [capitals, setCapitals] = useState(() => rowsFor('capital'));
  const [query, setQuery] = useState('');

  const saved = (key: string, sentence: string, difficulty: Difficulty) => {
    const update = (rows: Row[]) => rows.map((row) => (row.key === key ? { ...row, sentence, difficulty } : row));
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
