import { useEffect, useState } from 'react';

import { charadeFor, riddleFor, saveCharadeRiddle, saveCharadeSyllables } from '../../api/charades';
import { DeleteX } from '../../components/DeleteX';
import { EditableValue } from '../../components/EditableValue';
import type { CluePlace } from '@/types';

/**
 * Silhouette's `ContourEditor` (deployed under `CountriesView`'s own country card) is this
 * component's model: deployed under a place's own "Clues" block in `PlacesView`, one
 * `initialPlace` in prop (no picker of its own — the card list already provides that), nothing
 * written to disk. `charadeFor(place)` gives the syllable split — the shipped override when there
 * is one, the live `syllabify` heuristic otherwise — each paired with its riddle from the GLOBAL
 * dictionary (`riddleFor`): editing a syllable's riddle changes it for every other place with that
 * same syllable too, so this works for any of the 922 Clue places without repeating the same
 * curation over and over. The syllable split itself, on the other hand, is a PER-PLACE edit
 * (`saveCharadeSyllables`) — a syllable can be renamed in place, removed, or a new one added; an
 * empty result is valid (some names, e.g. "Bălți", just don't make a usable charade).
 *
 * Click-to-edit, save-on-blur/Enter (`EditableValue`, same as everywhere else in the admin) — a
 * riddle can be cleared back to "not curated" on purpose, so it opts into `allowEmpty`; a syllable
 * can't be renamed to blank (removing it is what the "×" is for), so it doesn't.
 */
export const CharadeEditor = ({ initialPlace }: { initialPlace: CluePlace }) => {
  const [place] = useState(initialPlace);
  const [syllables, setSyllables] = useState(() => charadeFor(place).syllables);
  const [riddles, setRiddles] = useState(() => syllables.map((syllable) => riddleFor(syllable)));
  // Which row last saved (a riddle edit, a rename, or a fresh addition), for a brief "✓" next to it.
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (savedIndex === null) return;
    const id = setTimeout(() => setSavedIndex(null), 1500);
    return () => clearTimeout(id);
  }, [savedIndex]);

  const applySyllables = (next: string[], flashIndex: number | null) => {
    saveCharadeSyllables(place, next).then((saved) => {
      setSyllables(saved);
      setRiddles(saved.map((syllable) => riddleFor(syllable)));
      setSavedIndex(flashIndex);
    });
  };

  const handleRename = (index: number, next: string) =>
    applySyllables(syllables.map((syllable, i) => (i === index ? next : syllable)), index);

  const handleRemove = (index: number) => applySyllables(syllables.filter((_, i) => i !== index), null);

  const handleAdd = (next: string) => applySyllables([...syllables, next], syllables.length);

  const handleSaveRiddle = (index: number, syllable: string, next: string) => {
    saveCharadeRiddle(syllable, next).then((updated) => {
      setRiddles((current) => current.map((riddle, i) => (i === index ? updated : riddle)));
      setSavedIndex(index);
    });
  };

  const savedFlag = (index: number) => (savedIndex === index ? <span className="save-flag saved">✓</span> : null);

  return (
    <div className="charade-editor">
      {syllables.length === 0 && <p className="absent">Aucune syllabe utilisable — pas de charade pour ce lieu.</p>}
      <table className="kv-table">
        <tbody>
          {syllables.map((syllable, index) => (
            <tr key={index}>
              <th>
                <EditableValue onSave={(next) => handleRename(index, next)} saveFlag={savedFlag(index)} value={syllable} />
              </th>
              <td>
                <EditableValue
                  allowEmpty
                  display={riddles[index] ?? '(pas encore de charade — la syllabe se dit telle quelle)'}
                  onSave={(next) => handleSaveRiddle(index, syllable, next)}
                  saveFlag={savedFlag(index)}
                  value={riddles[index] ?? ''}
                />
              </td>
              <td>
                <DeleteX name={`la syllabe « ${syllable} »`} onDelete={() => Promise.resolve(handleRemove(index))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <EditableValue
        display="+ Ajouter une syllabe"
        onSave={handleAdd}
        saveFlag={savedFlag(syllables.length)}
        value=""
      />
    </div>
  );
};
