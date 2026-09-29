import { useEffect, useState } from 'react';

import { jobOptions, personalityDraftFor, savePersonalityJob, savePersonalityName, type PersonalityDraft } from '../../api/personality';
import { EditableValue } from '../../components/EditableValue';
import type { CluePlace } from '@/types';

/**
 * A real, Wikipedia-documented person tied to the place (nom + métier optionnel). Same model as
 * `CharadeEditor`/`WordplayEditor` (deployed under a place's own "Clues" block in `PlacesView`,
 * click-to-edit/save-on-blur via `EditableValue`, nothing written to disk, every change just
 * logged): the name starts empty for every place, curated by hand from scratch, so it opts into
 * `allowEmpty` — clearing it back to blank removes the curated entry entirely (see
 * `savePersonalityName`'s own doc comment), same convention as `WordplayEditor`'s sentence.
 * `jobCode` is a plain select over `data/personalityJobs.json`'s shared vocabulary (`jobOptions`,
 * French label shown, code saved) rather than free text, so every place tagged "footballeur"
 * shares the exact same entry (and its English translation) instead of retyping it — an "(aucun)"
 * option clears it back to `null` (a name with no short safe job tag is a valid, curated state).
 */
export const PersonalityEditor = ({ initialPlace }: { initialPlace: CluePlace }) => {
  const [place] = useState(initialPlace);
  const [draft, setDraft] = useState<PersonalityDraft>(() => personalityDraftFor(place));
  // Which field last saved, for a brief "✓" next to it — same shape as CharadeEditor/WordplayEditor.
  const [savedField, setSavedField] = useState<string | null>(null);

  useEffect(() => {
    if (savedField === null) return;
    const id = setTimeout(() => setSavedField(null), 1500);
    return () => clearTimeout(id);
  }, [savedField]);

  const flagFor = (field: string) => (savedField === field ? <span className="save-flag saved">✓</span> : null);

  const handleSaveName = (next: string) => {
    savePersonalityName(place, draft, next).then((updated) => {
      setDraft(updated);
      setSavedField('name');
    });
  };

  const handleSaveJob = (next: string) => {
    savePersonalityJob(place, draft, next === '' ? null : next).then((updated) => {
      setDraft(updated);
      setSavedField('jobCode');
    });
  };

  return (
    <div className="charade-editor">
      <table className="kv-table">
        <tbody>
          <tr>
            <th>Nom</th>
            <td>
              <EditableValue
                allowEmpty
                display={draft.name || '(pas encore de personnalité)'}
                onSave={handleSaveName}
                saveFlag={flagFor('name')}
                value={draft.name}
              />
            </td>
          </tr>
          <tr>
            <th>Métier</th>
            <td>
              <div className="field-cell">
                <select className="field-select" value={draft.jobCode ?? ''} onChange={(e) => handleSaveJob(e.target.value)}>
                  <option value="">(aucun)</option>
                  {jobOptions().map(({ code, fr }) => (
                    <option key={code} value={code}>
                      {fr}
                    </option>
                  ))}
                </select>
                {flagFor('jobCode')}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
