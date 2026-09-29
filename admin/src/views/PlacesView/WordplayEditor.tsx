import { useEffect, useState } from 'react';

import { saveWordplayDifficulty, saveWordplaySentence, wordplayEntryFor } from '../../api/wordplay';
import { EditableValue } from '../../components/EditableValue';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../../constants';
import type { WordplayEntry } from '@/games/clues/helpers/wordplay';
import type { CluePlace, Difficulty } from '@/types';

/**
 * A pun on the place's name, one sentence revealed in a single click (no highlighted "explained"
 * second stage — dropped). Same model as `CharadeEditor` (deployed under a place's own "Clues"
 * block in `PlacesView`, click the text to edit it, blur/Enter to save — `EditableValue`, same as
 * everywhere else in the admin — nothing written to disk, every change just logged): the sentence
 * starts empty for every place, curated by hand from scratch (no heuristic fallback here, unlike
 * charade's syllable split), so it opts into `allowEmpty` (clearing it back to "not curated" is a
 * valid save). `difficulty` (how tricky the pun is, defaults to 'intermediate') is a plain select,
 * same look as `PlacesView`'s own difficulty picker — shown in-game as a colored dot, see
 * `ClueCard`'s own wordplay case.
 */
export const WordplayEditor = ({ initialPlace }: { initialPlace: CluePlace }) => {
  const [place] = useState(initialPlace);
  const [entry, setEntry] = useState<WordplayEntry>(() => wordplayEntryFor(place));
  // Which field last saved, for a brief "✓" next to it — same shape as `CharadeEditor`'s own.
  const [savedField, setSavedField] = useState<string | null>(null);

  useEffect(() => {
    if (savedField === null) return;
    const id = setTimeout(() => setSavedField(null), 1500);
    return () => clearTimeout(id);
  }, [savedField]);

  const flagFor = (field: string) => (savedField === field ? <span className="save-flag saved">✓</span> : null);

  const handleSaveSentence = (next: string) => {
    saveWordplaySentence(place, entry, next).then((updated) => {
      setEntry(updated);
      setSavedField('sentence');
    });
  };

  const handleSaveDifficulty = (next: Difficulty) => {
    saveWordplayDifficulty(place, entry, next).then((updated) => {
      setEntry(updated);
      setSavedField('difficulty');
    });
  };

  return (
    <div className="charade-editor">
      <table className="kv-table">
        <tbody>
          <tr>
            <th>Phrase</th>
            <td>
              <EditableValue
                allowEmpty
                display={entry.sentence || '(pas encore de jeu de mot)'}
                onSave={handleSaveSentence}
                saveFlag={flagFor('sentence')}
                value={entry.sentence}
              />
            </td>
          </tr>
          <tr>
            <th>Difficulté</th>
            <td>
              <div className="field-cell">
                <select
                  className="field-select"
                  style={{ '--tier-color': DIFFICULTY_COLORS[entry.difficulty] } as React.CSSProperties}
                  value={entry.difficulty}
                  onChange={(e) => handleSaveDifficulty(e.target.value as Difficulty)}
                >
                  {DIFFICULTY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </option>
                  ))}
                </select>
                {flagFor('difficulty')}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
