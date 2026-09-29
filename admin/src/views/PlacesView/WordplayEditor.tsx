import { useEffect, useState } from 'react';

import { saveWordplayExplained, saveWordplaySentence, wordplayEntryFor } from '../../api/wordplay';
import { EditableValue } from '../../components/EditableValue';
import type { WordplayEntry } from '@/games/clues/helpers/wordplay';
import type { CluePlace } from '@/types';

/**
 * A pun on the place's name, in 2 stages: `sentence` alone, then `explained` with the punning
 * word(s) wrapped in `+plus+` signs so the game highlights them (see `highlightSegments`). Same
 * model as `CharadeEditor` (deployed under a place's own "Clues" block in `PlacesView`, click the
 * text to edit it, blur/Enter to save — `EditableValue`, same as everywhere else in the admin —
 * nothing written to disk, every change just logged) — both fields start empty for every place,
 * curated by hand from scratch (no heuristic fallback here, unlike charade's syllable split), so
 * both opt into `allowEmpty` (clearing one back to "not curated" is a valid save).
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

  const handleSaveExplained = (next: string) => {
    saveWordplayExplained(place, entry, next).then((updated) => {
      setEntry(updated);
      setSavedField('explained');
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
            <th>Expliquée</th>
            <td>
              <EditableValue
                allowEmpty
                display={entry.explained || 'même phrase, +mot+ pour le mettre en avant'}
                onSave={handleSaveExplained}
                saveFlag={flagFor('explained')}
                value={entry.explained}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
