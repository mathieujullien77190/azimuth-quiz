import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { saveContourDifficulty, saveCountry, type CountryPatch, type CountryRecord } from '../../api/countries';
import type { Difficulty } from '@/types';

import type { Field, SaveState } from './types';

/**
 * Every way of editing a country, with the optimistic update of the list it lives in and the little
 * saving/saved/error flag of each field: what the Countries list and the Monde page's side panel both use, so a
 * country is always written through the same `api/countries` functions (journal and data version included).
 */
export const useCountryEditing = (
  countries: CountryRecord[] | null,
  setCountries: Dispatch<SetStateAction<CountryRecord[] | null>>,
) => {
  const [saveState, setSaveState] = useState<SaveState | null>(null);

  useEffect(() => {
    if (saveState?.status !== 'saved') return;
    const id = setTimeout(() => setSaveState(null), 1500);
    return () => clearTimeout(id);
  }, [saveState]);

  const handleChange = (row: CountryRecord, field: Field, patch: CountryPatch) => {
    const previous = countries!.find((c) => c.code === row.code)!;
    setCountries((cur) => cur!.map((c) => (c.code === row.code ? { ...c, ...patch } : c)));
    setSaveState({ code: row.code, field, status: 'saving' });

    saveCountry(row, patch)
      .then((updated) => {
        setCountries((cur) => cur!.map((c) => (c.code === row.code ? updated : c)));
        setSaveState({ code: row.code, field, status: 'saved' });
      })
      .catch((err: Error) => {
        setCountries((cur) => cur!.map((c) => (c.code === row.code ? previous : c)));
        setSaveState({ code: row.code, field, status: 'error', message: err.message });
      });
  };

  /** The Silhouette difficulty: its own write, because the group numbers follow (see `saveContourDifficulty`). */
  const handleDifficultyChange = (row: CountryRecord, difficulty: Difficulty) => {
    const previous = countries!.find((c) => c.code === row.code)!;
    setCountries((cur) => cur!.map((c) => (c.code === row.code ? { ...c, difficulty } : c)));
    setSaveState({ code: row.code, field: 'difficulty', status: 'saving' });

    saveContourDifficulty(row, difficulty)
      .then(() => setSaveState({ code: row.code, field: 'difficulty', status: 'saved' }))
      .catch((err: Error) => {
        setCountries((cur) => cur!.map((c) => (c.code === row.code ? previous : c)));
        setSaveState({ code: row.code, field: 'difficulty', status: 'error', message: err.message });
      });
  };

  const saveFlagFor = (row: CountryRecord, field: Field) => {
    const s = saveState?.code === row.code && saveState.field === field ? saveState : null;
    if (!s) return null;
    if (s.status === 'saving') return <span className="save-flag saving">…</span>;
    if (s.status === 'saved') return <span className="save-flag saved">✓</span>;
    return (
      <span className="save-flag error" title={s.message}>
        ⚠
      </span>
    );
  };

  return { saveFlagFor, handleChange, handleDifficultyChange };
};
