import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import {
  deletePlace,
  saveClues,
  saveCompass,
  saveDifficulty,
  type CluesPatch,
  type CompassPatch,
  type PlaceRow,
} from '../../api/places';
import type { Difficulty } from '@/types';

import { CLUE_FIELD_BY_KEY } from './helpers';
import type { Field, SaveState } from './types';

/**
 * Every way of editing a place, with the optimistic update of the list it lives in and the little saving/saved/error
 * flag of each field: what the Places list and the Monde page's side panel both use, so a place is always written
 * through the same `api/places` functions (journal and data version included).
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
    const previousClues = row.clues;
    setRows((cur) =>
      cur!.map((r) =>
        r.key === row.key
          ? { ...r, compass: r.compass && { ...r.compass, difficulty }, clues: r.clues && { ...r.clues, difficulty } }
          : r,
      ),
    );
    setSaveState({ key: row.key, field: 'difficulty', status: 'saving' });

    saveDifficulty(row, difficulty)
      .then(({ compass, clues }) => {
        setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, compass, clues } : r)));
        setSaveState({ key: row.key, field: 'difficulty', status: 'saved' });
      })
      .catch((err: Error) => {
        setRows((cur) =>
          cur!.map((r) => (r.key === row.key ? { ...r, compass: previousCompass, clues: previousClues } : r)),
        );
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

  const handleCluesChange = (row: PlaceRow, patch: CluesPatch) => {
    const key = Object.keys(patch)[0];
    const field = CLUE_FIELD_BY_KEY[key];
    const previous = row.clues;
    setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, clues: { ...r.clues!, ...patch } } : r)));
    setSaveState({ key: row.key, field, status: 'saving' });

    saveClues(row, patch)
      .then((updated) => {
        setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, clues: updated } : r)));
        setSaveState({ key: row.key, field, status: 'saved' });
      })
      .catch((err: Error) => {
        setRows((cur) => cur!.map((r) => (r.key === row.key ? { ...r, clues: previous } : r)));
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

  return { saveFlagFor, handleDifficultyChange, handleCompassChange, handleCluesChange, handleDelete };
};
