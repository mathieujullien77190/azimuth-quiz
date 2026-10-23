import { useEffect, useState } from 'react';

import {
  jobOptions,
  personalityDraftFor,
  savePersonalityJob,
  savePersonalityName,
  type PersonalityDraft,
} from '../../api/personality';
import { EditableValue } from '../../components/EditableValue';
import type { CluePlace } from '@/types';

/**
 * Personnalite reelle documentee par Wikipedia, liee au lieu (nom + metier optionnel). Meme modele que
 * `WordplayEditor` : clic pour editer, sauvegarde au blur via `EditableValue`. Le nom part vide pour chaque lieu,
 * cure a la main ; le metier est un select de codes (libelle francais affiche, code sauve) pour que tous les
 * "footballeur" partagent la meme entree et sa traduction ; "(aucun)" le remet a `null`.
 */
export const PersonalityEditor = ({ initialPlace }: { initialPlace: CluePlace }) => {
  const [place] = useState(initialPlace);
  const [draft, setDraft] = useState<PersonalityDraft>(() => personalityDraftFor(place));
  // Dernier champ sauve, pour un bref "✓" a cote.
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
    <div className="clue-editor">
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
                <select
                  className="field-select"
                  value={draft.jobCode ?? ''}
                  onChange={(e) => handleSaveJob(e.target.value)}
                >
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
