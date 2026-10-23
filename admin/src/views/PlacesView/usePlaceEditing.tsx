import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import {
  deletePlace,
  saveCompass,
  saveDifficulty,
  type CompassPatch,
  type PlaceRow,
} from '../../api/places';
import type { Difficulty } from '@/types';

import type { Field, SaveState } from './types';

/**
 * Toutes les editions d'un lieu, avec mise a jour optimiste de la liste et petit drapeau enregistrement/ok/erreur par
 * champ ; sert a la liste Lieux et au panneau de la page Monde, donc tout passe par `api/places` (journal et version
 * inclus).
 */
export const usePlaceEditing = (setRows: Dispatch<SetStateAction<PlaceRow[] | null>>) => {
  const [saveState, setSaveState] = useState<SaveState | null>(null);

  useEffect(() => {
    if (saveState?.status !== 'saved') return;
    const id = setTimeout(() => setSaveState(null), 1500);
    return () => clearTimeout(id);
  }, [saveState]);

  const handleDifficultyChange = (row: PlaceRow, difficulty: Difficulty) => {
    const previousCompass = row.compass;
    setRows((cur) =>
      cur!.map((r) =>
        r.key === row.key
          ? { ...r, compass: r.compass && { ...r.compass, difficulty } }
          : r,
      ),
    );
    setSaveState({ key: row.key, field: 'difficulty', status: 'saving' });

    saveDifficulty(row, difficulty)
      .then((compass) => {
        setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, compass } : r)));
        setSaveState({ key: row.key, field: 'difficulty', status: 'saved' });
      })
      .catch((err: Error) => {
        setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, compass: previousCompass } : r)));
        setSaveState({ key: row.key, field: 'difficulty', status: 'error', message: err.message });
      });
  };

  const handleCompassChange = (row: PlaceRow, patch: CompassPatch) => {
    const field: Field = 'category' in patch ? 'category' : 'description';
    const previous = row.compass;
    setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, compass: { ...r.compass!, ...patch } } : r)));
    setSaveState({ key: row.key, field, status: 'saving' });

    saveCompass(row, patch)
      .then((updated) => {
        setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, compass: updated } : r)));
        setSaveState({ key: row.key, field, status: 'saved' });
      })
      .catch((err: Error) => {
        setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, compass: previous } : r)));
        setSaveState({ key: row.key, field, status: 'error', message: err.message });
      });
  };

  const saveFlagFor = (row: PlaceRow, field: Field) => {
    const s = saveState?.key === row.key && saveState.field === field ? saveState : null;
    if (!s) return null;
    if (s.status === 'saving') return <span className="save-flag saving">…</span>;
    if (s.status === 'saved') return <span className="save-flag saved">✓</span>;
    return (
      <span className="save-flag error" title={s.message}>
        ⚠
      </span>
    );
  };

  const handleDelete = async (row: PlaceRow) => {
    await deletePlace(row);
    setRows((cur) => cur!.filter((r) => r.key !== row.key));
  };

  return { saveFlagFor, handleDifficultyChange, handleCompassChange, handleDelete };
};
