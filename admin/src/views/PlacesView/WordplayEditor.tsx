import { useEffect, useState } from 'react';

import { saveWordplayDifficulty, saveWordplaySentence, wordplayEntryFor } from '../../api/wordplay';
import { EditableValue } from '../../components/EditableValue';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../../constants';
import type { WordplayEntry } from '@/games/clues/helpers/wordplay';
import type { CluePlace, Difficulty } from '@/types';

/**
 * Jeu de mots sur le nom du lieu, une phrase revelee en un clic. Meme modele que `PersonalityEditor` : clic pour
 * editer, blur/Entree pour sauver. La phrase part vide, cure a la main ; `allowEmpty` : la vider = "non cure".
 * `difficulty` (defaut 'intermediate') est un select comme celui de `PlacesView`, montre en jeu en point colore.
 */
export const WordplayEditor = ({ initialPlace }: { initialPlace: CluePlace }) => {
  const [place] = useState(initialPlace);
  const [entry, setEntry] = useState<WordplayEntry>(() => wordplayEntryFor(place));
  // Dernier champ sauve, pour un bref "✓" a cote.
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
    <div className="clue-editor">
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
